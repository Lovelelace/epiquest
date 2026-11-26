import {
  type AbilityBonus,
  abilityModifiers,
  cantripsKnown,
  type CharacterChoices,
  type ClassData,
  type ClassProgression,
  type CreationRules,
  expertiseCount,
  finalAbilityScores,
  highestSpellLevel,
  maxSpells,
  type SpeciesData,
  spellSlots,
} from "@epiquest/rules";
import type { CreationOptions, DraftChoices } from "@epiquest/schemas";
import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { SrdService } from "../srd/srd.service.js";
import {
  backgroundSkills,
  mapClass,
  mapSpecies,
  type SrdEntry,
  startingEquipment,
} from "./srd-mapping.js";

/** Tout ce que l'origine d'un personnage implique, résolu depuis le SRD. */
export interface ResolvedOrigin {
  classData: ClassData;
  species: SpeciesData;
  progression: ClassProgression;
  subclassNames: Map<string, string>;
  rules: CreationRules;
  options: CreationOptions;
  equipmentItems: SrdEntry[];
}

const DEFAULT_ABILITY_MODIFIER = 0;

@Injectable()
export class CreationRulesService {
  constructor(private readonly srd: SrdService) {}

  private async entry(
    entity: "species" | "classes" | "backgrounds",
    slug: string,
  ): Promise<SrdEntry> {
    const detail = await this.srd.get(entity, slug);
    return { slug: detail.slug, name: detail.name, data: detail.data };
  }

  /** Espèce choisie et, pour une sous-espèce, son espèce parente. */
  private async speciesEntries(slug: string): Promise<[SrdEntry, SrdEntry | null]> {
    const chosen = await this.entry("species", slug);
    const race = chosen.data.race;
    const parentSlug =
      typeof race === "object" && race !== null && "index" in race && typeof race.index === "string"
        ? race.index
        : null;
    const subraces = chosen.data.subraces;
    if (!parentSlug && Array.isArray(subraces) && subraces.length > 0) {
      throw new UnprocessableEntityException({
        code: "SUBSPECIES_REQUIRED",
        message: "Choisissez une sous-espèce avant de continuer.",
      });
    }
    return [chosen, parentSlug ? await this.entry("species", parentSlug) : null];
  }

  /**
   * Résout les règles de création d'un brouillon au niveau donné. Le modificateur de la
   * caractéristique d'incantation compte pour les sorts préparés : 0 tant qu'il n'est pas choisi.
   * `improvements` ajoute les augmentations de caractéristique (montée de niveau).
   */
  async resolve(
    choices: DraftChoices,
    level = 1,
    improvements: readonly AbilityBonus[] = [],
  ): Promise<ResolvedOrigin> {
    if (!choices.species || !choices.class || !choices.background) {
      throw new UnprocessableEntityException({
        code: "ORIGIN_INCOMPLETE",
        message: "Choisissez d'abord une espèce, une classe et un historique.",
      });
    }
    const [[speciesEntry, parentEntry], classEntry, backgroundEntry] = await Promise.all([
      this.speciesEntries(choices.species),
      this.entry("classes", choices.class),
      this.entry("backgrounds", choices.background),
    ]);
    const species = mapSpecies(speciesEntry, parentEntry);
    const { classData, progression, skillChoice } = mapClass(classEntry);
    const grantedSkills = [
      ...new Set([...species.grantedSkills, ...backgroundSkills(backgroundEntry)]),
    ];

    const [subclasses, spells, equipmentItems] = await Promise.all([
      this.srd.listDetails("subclasses", { class: choices.class }),
      progression.spellcasting ? this.srd.listDetails("spells", { class: choices.class }) : [],
      this.srd.listDetails("items", { kind: "equipment" }),
    ]);

    const spellcasting = progression.spellcasting;
    let resolvedSpellcasting: CreationRules["spellcasting"] = null;
    let optionSpellcasting: CreationOptions["spellcasting"] = null;
    if (spellcasting) {
      const modifier = choices.baseAbilityScores
        ? abilityModifiers(
            finalAbilityScores(choices.baseAbilityScores, [...species.bonuses, ...improvements]),
          )[spellcasting.ability]
        : DEFAULT_ABILITY_MODIFIER;
      const maxSpellLevel = highestSpellLevel(spellSlots(spellcasting.progression, level));
      const classSpells = spells.map((spell) => ({
        slug: spell.slug,
        name: spell.name,
        level: Number(spell.data.level),
      }));
      // La validation connaît toute la liste (pour signaler un niveau trop élevé) ; l'écran ne propose que l'accessible.
      const spellList = classSpells.filter((spell) => spell.level <= maxSpellLevel);
      const counts = {
        cantripsKnown: cantripsKnown(spellcasting, level),
        maxSpells: maxSpells(spellcasting, level, modifier),
      };
      resolvedSpellcasting = {
        progression: spellcasting.progression,
        ...counts,
        spellList: classSpells.map((spell) => ({ index: spell.slug, level: spell.level })),
      };
      optionSpellcasting = { ability: spellcasting.ability, ...counts, maxSpellLevel, spellList };
    }

    const rules: CreationRules = {
      skillChoice,
      grantedSkills,
      expertiseCount: expertiseCount(progression, level),
      subclass: {
        level: progression.subclassLevel,
        options: subclasses.map((subclass) => subclass.slug),
      },
      abilityScoreImprovementLevels: progression.abilityScoreImprovementLevels,
      originBonuses: species.bonuses,
      spellcasting: resolvedSpellcasting,
      rolledScores: null,
    };
    const options: CreationOptions = {
      skillChoice,
      grantedSkills,
      expertiseCount: rules.expertiseCount,
      originBonuses: species.bonuses,
      subclass: {
        level: progression.subclassLevel,
        options: subclasses.map((subclass) => ({ slug: subclass.slug, name: subclass.name })),
      },
      spellcasting: optionSpellcasting,
      ...startingEquipment([classEntry, backgroundEntry], equipmentItems),
    };
    return {
      classData,
      species: species.species,
      progression,
      subclassNames: new Map(subclasses.map((subclass) => [subclass.slug, subclass.name])),
      rules,
      options,
      equipmentItems,
    };
  }
}

/** Choix du brouillon au format attendu par la validation du moteur. */
export function toCharacterChoices(
  choices: DraftChoices,
  rules: CreationRules,
  level = 1,
): CharacterChoices {
  return {
    level,
    abilityMethod: choices.abilityMethod ?? "standard-array",
    baseAbilityScores: choices.baseAbilityScores ?? {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
    },
    abilityBonuses: rules.originBonuses,
    chosenSkills: choices.chosenSkills,
    expertise: choices.expertise,
    subclass: choices.subclass,
    cantrips: choices.cantrips,
    spells: choices.spells,
  };
}
