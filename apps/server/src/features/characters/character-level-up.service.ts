import { schema, type SrdDatabase } from "@epiquest/db";
import {
  type AbilityBonus,
  deriveStatistics,
  extendUsedSlots,
  hitPointGain,
  levelUpGains,
  MAX_SUPPORTED_LEVEL,
  type RollDie,
  type Skill,
  spellSlots,
  validateCharacterChoices,
} from "@epiquest/rules";
import {
  EMPTY_DRAFT_CHOICES,
  levelUpOptionsSchema,
  type Character,
  type DraftChoices,
  type LevelUpOptions,
  type LevelUpRequest,
} from "@epiquest/schemas";
import { Inject, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { ROLL_DIE } from "../../shared/random/random.module.js";
import { CHARACTER_DATABASE } from "./character-database.js";
import {
  type CharacterRecord,
  type StoredChoices,
  toBuild,
  toCharacter,
} from "./character-builder.js";
import { CharacterReferencesService } from "./character-references.service.js";
import { CharactersService } from "./characters.service.js";
import { CreationRulesService } from "./creation-rules.service.js";

const { characters, characterHistory } = schema;

type CharacterRow = Awaited<ReturnType<CharactersService["findRecord"]>>["row"];

function maxLevelReached(): UnprocessableEntityException {
  return new UnprocessableEntityException({
    code: "LEVEL_MAX_REACHED",
    message: `Le niveau ${MAX_SUPPORTED_LEVEL} est le plus haut niveau pris en charge.`,
  });
}

/** Choix d'origine d'un personnage créé, au format des brouillons, pour résoudre ses règles. */
function originChoices(record: CharacterRecord, row: CharacterRow): DraftChoices {
  return {
    ...EMPTY_DRAFT_CHOICES,
    species: row.speciesSlug,
    class: row.classSlug,
    background: row.backgroundSlug,
    abilityMethod: record.choices.abilityMethod,
    baseAbilityScores: record.choices.baseAbilityScores,
  };
}

@Injectable()
export class CharacterLevelUpService {
  constructor(
    @Inject(CHARACTER_DATABASE) private readonly db: SrdDatabase,
    @Inject(ROLL_DIE) private readonly rollDie: RollDie,
    private readonly characters: CharactersService,
    private readonly creationRules: CreationRulesService,
    private readonly references: CharacterReferencesService,
  ) {}

  /** Ce que le niveau suivant apporte et les choix à faire. */
  async options(id: string): Promise<LevelUpOptions> {
    const { record, row } = await this.characters.findRecord(id);
    if (record.level >= MAX_SUPPORTED_LEVEL) throw maxLevelReached();
    const nextLevel = record.level + 1;
    const origin = await this.creationRules.resolve(
      originChoices(record, row),
      nextLevel,
      this.improvements(record.choices),
    );
    const gains = levelUpGains(origin.progression, record.level);
    const spellcasting = origin.options.spellcasting;
    return levelUpOptionsSchema.parse({
      nextLevel,
      hitDie: origin.classData.hitDie,
      averageHitPoints: hitPointGain("average", origin.classData.hitDie, this.rollDie),
      features: origin.progression.features[nextLevel] ?? [],
      subclassOptions:
        gains.choosesSubclass && !record.subclassSlug
          ? [...origin.subclassNames].map(([slug, name]) => ({ slug, name }))
          : [],
      abilityScoreImprovement: gains.abilityScoreImprovement,
      expertiseCount: gains.expertiseCount,
      newCantrips: gains.newCantrips,
      maxSpells: spellcasting?.maxSpells ?? 0,
      spellList: spellcasting?.spellList ?? [],
    });
  }

  /**
   * Passe au niveau suivant : valide les nouveaux choix avec le moteur au nouveau niveau,
   * tire ou prend la moyenne du dé de vie côté serveur, puis enregistre et historise.
   */
  async levelUp(id: string, request: LevelUpRequest): Promise<Character> {
    const { record, row } = await this.characters.findRecord(id);
    if (record.level >= MAX_SUPPORTED_LEVEL) throw maxLevelReached();
    const nextLevel = record.level + 1;
    const improvements: AbilityBonus[] = request.abilityScoreImprovement.map((bonus) => ({
      ...bonus,
      source: "ability-score-improvement",
    }));
    const abilityBonuses = [...record.choices.abilityBonuses, ...improvements];
    const origin = await this.creationRules.resolve(
      originChoices(record, row),
      nextLevel,
      abilityBonuses.filter((bonus) => bonus.source === "ability-score-improvement"),
    );
    const granted = new Set<string>(origin.rules.grantedSkills);
    const subclass = record.subclassSlug ?? request.subclass ?? null;
    const choices: StoredChoices = {
      ...record.choices,
      abilityBonuses,
      expertise: [...record.choices.expertise, ...request.expertise],
      cantrips: [...record.choices.cantrips, ...request.cantrips],
      spells: request.spells ?? record.choices.spells,
    };
    const violations = validateCharacterChoices(
      {
        level: nextLevel,
        abilityMethod: choices.abilityMethod,
        baseAbilityScores: choices.baseAbilityScores,
        abilityBonuses,
        // Compétences validées à la création : celles qui ne viennent pas de l'origine.
        chosenSkills: choices.skillProficiencies.filter((skill) => !granted.has(skill)) as Skill[],
        expertise: choices.expertise as Skill[],
        subclass,
        cantrips: choices.cantrips,
        spells: choices.spells,
      },
      {
        ...origin.rules,
        rolledScores:
          choices.abilityMethod === "rolled" ? Object.values(choices.baseAbilityScores) : null,
      },
    );
    if (violations.length > 0) {
      throw new UnprocessableEntityException({
        code: "LEVEL_UP_INVALID",
        message: "Les choix du nouveau niveau ne respectent pas les règles.",
        details: violations,
      });
    }

    const gain = hitPointGain(request.hitPointMethod, origin.classData.hitDie, this.rollDie);
    const subclassSlug =
      subclass && origin.rules.subclass.options.includes(subclass) ? subclass : null;
    const references = await this.references.load({ ...row, subclassSlug });
    const previousMaximum = deriveStatistics(toBuild(record, references)).hitPointMaximum;
    const leveled: CharacterRecord = {
      ...record,
      level: nextLevel,
      subclassSlug,
      choices: { ...choices, hitPointGains: [...choices.hitPointGains, gain] },
    };
    const maximum = deriveStatistics(toBuild(leveled, references)).hitPointMaximum;
    const slots = spellSlots(origin.classData.spellcasting?.progression ?? null, nextLevel);
    leveled.state = {
      ...record.state,
      currentHitPoints: record.state.currentHitPoints + maximum - previousMaximum,
      hitDiceRemaining: record.state.hitDiceRemaining + 1,
      spellSlotsUsed: extendUsedSlots(record.state.spellSlotsUsed, slots.slots.length),
    };
    leveled.updatedAt = new Date();

    await this.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({
          level: leveled.level,
          subclassSlug: leveled.subclassSlug,
          choices: leveled.choices,
          state: leveled.state,
          updatedAt: leveled.updatedAt,
        })
        .where(eq(characters.id, id));
      await tx.insert(characterHistory).values({
        characterId: id,
        type: "level-up",
        summary: `Passage au niveau ${nextLevel} : +${maximum - previousMaximum} PV maximum.`,
        payload: { request, hitPointGain: gain },
      });
    });
    return toCharacter(leveled, references);
  }

  private improvements(choices: StoredChoices): AbilityBonus[] {
    return choices.abilityBonuses.filter((bonus) => bonus.source === "ability-score-improvement");
  }
}
