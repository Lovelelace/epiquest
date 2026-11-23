import { schema, type SrdDatabase } from "@epiquest/db";
import {
  type DerivedStatistics,
  deriveStatistics,
  spellSlots,
  validateCharacterChoices,
  type ValidationError,
} from "@epiquest/rules";
import {
  characterStateSchema,
  creationPreviewSchema,
  type Character,
  type CharacterDraft,
  type CharacterState,
  type Coins,
  type CreationPreview,
} from "@epiquest/schemas";
import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CHARACTER_DATABASE } from "./character-database.js";
import {
  type CharacterRecord,
  inventoryItem,
  storedChoicesSchema,
  toBuild,
  toCharacter,
} from "./character-builder.js";
import { CharacterReferencesService } from "./character-references.service.js";
import {
  CreationRulesService,
  type ResolvedOrigin,
  toCharacterChoices,
} from "./creation-rules.service.js";
import { DraftsService } from "./drafts.service.js";

const { characters, characterDrafts, characterHistory } = schema;

const NO_COINS: Coins = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
const startingGoldSchema = z.looseObject({
  quantity: z.number().int(),
  unit: z.enum(["cp", "sp", "ep", "gp", "pp"]),
});

type CharacterRow = typeof characters.$inferSelect;

/** Personnage prêt à être enregistré, assemblé depuis un brouillon. */
interface AssembledCharacter {
  violations: ValidationError[];
  record: Omit<CharacterRecord, "id" | "createdAt" | "updatedAt"> | null;
  statistics: DerivedStatistics | null;
}

function violation(code: string, message: string, path: string): ValidationError {
  // Codes propres à la création, hors de la liste du moteur (nom, équipement).
  return { code, message, path } as ValidationError;
}

function equipmentViolations(draft: CharacterDraft, origin: ResolvedOrigin): ValidationError[] {
  const choices = origin.options.equipmentChoices;
  if (draft.choices.equipment.length !== choices.length) {
    return [
      violation(
        "EQUIPMENT_INCOMPLETE",
        "Choisissez une option pour chaque équipement de départ.",
        "equipment",
      ),
    ];
  }
  return draft.choices.equipment.flatMap((selected, index) =>
    selected < (choices[index]?.options.length ?? 0)
      ? []
      : [
          violation(
            "EQUIPMENT_NOT_ALLOWED",
            "Cette option d'équipement n'existe pas.",
            `equipment.${index}`,
          ),
        ],
  );
}

function toRecord(row: CharacterRow): CharacterRecord {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    subclassSlug: row.subclassSlug,
    choices: storedChoicesSchema.parse(row.choices),
    state: characterStateSchema.parse(row.state),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class CharactersService {
  constructor(
    @Inject(CHARACTER_DATABASE) private readonly db: SrdDatabase,
    private readonly drafts: DraftsService,
    private readonly creationRules: CreationRulesService,
    private readonly references: CharacterReferencesService,
  ) {}

  /** Assemble le personnage d'un brouillon et liste ce qui l'empêche d'être créé. */
  private async assemble(draft: CharacterDraft): Promise<AssembledCharacter> {
    const { choices } = draft;
    const violations: ValidationError[] = [];
    if (!choices.name)
      violations.push(violation("NAME_REQUIRED", "Donnez un nom à votre personnage.", "name"));
    if (!choices.species || !choices.class || !choices.background) {
      violations.push(
        violation(
          "ORIGIN_INCOMPLETE",
          "Choisissez une espèce, une classe et un historique.",
          "species",
        ),
      );
      return { violations, record: null, statistics: null };
    }
    if (!choices.abilityMethod || !choices.baseAbilityScores) {
      violations.push(
        violation("ABILITIES_REQUIRED", "Répartissez les caractéristiques.", "baseAbilityScores"),
      );
      return { violations, record: null, statistics: null };
    }
    const origin = await this.creationRules.resolve(choices);
    const rules = {
      ...origin.rules,
      rolledScores: draft.abilityRolls?.map((roll) => roll.total) ?? null,
    };
    violations.push(...validateCharacterChoices(toCharacterChoices(choices, rules), rules));
    violations.push(...equipmentViolations(draft, origin));

    const items = new Map(origin.equipmentItems.map((item) => [item.slug, item]));
    const chosen = draft.choices.equipment.flatMap(
      (selected, index) => origin.options.equipmentChoices[index]?.options[selected]?.items ?? [],
    );
    const inventory = [...origin.options.fixedEquipment, ...chosen].flatMap((item) => {
      const entry = items.get(item.slug);
      return entry ? [inventoryItem(entry, item.quantity)] : [];
    });
    const background = await this.references.entry("backgrounds", choices.background);
    const gold = startingGoldSchema.safeParse(background.data.starting_gold);
    const slots = spellSlots(origin.classData.spellcasting?.progression ?? null, 1);
    const state: CharacterState = {
      currentHitPoints: 0,
      temporaryHitPoints: 0,
      hitDiceRemaining: 1,
      spellSlotsUsed: slots.slots.map(() => 0),
      pactSlotsUsed: 0,
      money: gold.success ? { ...NO_COINS, [gold.data.unit]: gold.data.quantity } : NO_COINS,
      inventory,
      notes: "",
    };
    const record = {
      name: choices.name ?? "",
      level: 1,
      subclassSlug: choices.subclass,
      choices: {
        abilityMethod: choices.abilityMethod,
        baseAbilityScores: choices.baseAbilityScores,
        abilityBonuses: [...origin.rules.originBonuses],
        skillProficiencies: [...origin.rules.grantedSkills, ...choices.chosenSkills],
        expertise: choices.expertise,
        cantrips: choices.cantrips,
        spells: choices.spells,
        hitPointGains: [],
      },
      state,
    };
    const subclassSlug =
      choices.subclass && origin.rules.subclass.options.includes(choices.subclass)
        ? choices.subclass
        : null;
    const references = await this.references.load({
      speciesSlug: choices.species,
      classSlug: choices.class,
      backgroundSlug: choices.background,
      subclassSlug,
    });
    const statistics = deriveStatistics(
      toBuild({ ...record, id: "", createdAt: new Date(), updatedAt: new Date() }, references),
    );
    state.currentHitPoints = statistics.hitPointMaximum;
    return { violations, record, statistics };
  }

  /** Récapitulatif : erreurs restantes et statistiques calculées par le moteur. */
  async preview(draftId: string): Promise<CreationPreview> {
    const { violations, statistics } = await this.assemble(await this.drafts.get(draftId));
    return creationPreviewSchema.parse({ violations, statistics });
  }

  /** Crée le personnage si les choix sont valides (le serveur fait autorité), puis supprime le brouillon. */
  async createFromDraft(draftId: string): Promise<Character> {
    const draft = await this.drafts.get(draftId);
    const { violations, record } = await this.assemble(draft);
    if (
      violations.length > 0 ||
      !record ||
      !draft.choices.species ||
      !draft.choices.class ||
      !draft.choices.background
    ) {
      throw new UnprocessableEntityException({
        code: "CHARACTER_INVALID",
        message: "Le personnage ne respecte pas les règles : corrigez les points signalés.",
        details: violations,
      });
    }
    const id = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(characters)
        .values({
          name: record.name,
          level: record.level,
          speciesSlug: draft.choices.species ?? "",
          classSlug: draft.choices.class ?? "",
          backgroundSlug: draft.choices.background ?? "",
          subclassSlug: record.subclassSlug,
          choices: record.choices,
          state: record.state,
        })
        .returning({ id: characters.id });
      if (!row) throw new Error("Création du personnage sans ligne renvoyée");
      await tx.insert(characterHistory).values({
        characterId: row.id,
        type: "created",
        summary: `Création de ${record.name} au niveau 1.`,
        payload: { abilityMethod: record.choices.abilityMethod, abilityRolls: draft.abilityRolls },
      });
      await tx.delete(characterDrafts).where(eq(characterDrafts.id, draftId));
      return row.id;
    });
    return this.get(id);
  }

  async findRecord(id: string): Promise<{ record: CharacterRecord; row: CharacterRow }> {
    const [row] = await this.db.select().from(characters).where(eq(characters.id, id));
    if (!row)
      throw new NotFoundException({
        code: "CHARACTER_NOT_FOUND",
        message: "Ce personnage n'existe pas.",
      });
    return { record: toRecord(row), row };
  }

  async get(id: string): Promise<Character> {
    const { record, row } = await this.findRecord(id);
    return toCharacter(record, await this.references.load(row));
  }
}
