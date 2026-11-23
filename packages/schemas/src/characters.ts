import { ABILITIES, SKILLS } from "@epiquest/rules";
import { z } from "zod";

// Contrats du personnage : création (brouillon), fiche, jets, vie du personnage et montée de niveau.

const slug = z.string().trim().min(1).max(100);
const isoDate = z.iso.datetime({ offset: true });
const nonNegative = z.number().int().min(0);

export const abilitySchema = z.enum(ABILITIES);
export const skillSchema = z.enum(SKILLS);
export const abilityScoresSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30),
});
export const abilityMethodSchema = z.enum(["point-buy", "standard-array", "rolled"]);
export const abilityBonusSchema = z.object({
  ability: abilitySchema,
  amount: z.number().int().min(1).max(2),
  source: z.enum(["species", "background", "ability-score-improvement"]),
});

/** Erreur de validation des règles, renvoyée par le serveur et affichée par l'assistant. */
export const ruleViolationSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.string(),
});

// ---------------------------------------------------------------------------
// Brouillon de création (#31 à #33)

export const wizardStepSchema = z.enum([
  "species",
  "class",
  "background",
  "abilities",
  "skills",
  "equipment",
  "spells",
  "summary",
]);

/** Choix en cours : tout est facultatif tant que le personnage n'est pas créé. */
export const draftChoicesSchema = z.object({
  name: z.string().trim().min(1).max(80).nullable(),
  /** Slug de la sous-espèce quand elle existe (« high-elf »), sinon de l'espèce. */
  species: slug.nullable(),
  class: slug.nullable(),
  background: slug.nullable(),
  abilityMethod: abilityMethodSchema.nullable(),
  baseAbilityScores: abilityScoresSchema.nullable(),
  chosenSkills: z.array(skillSchema).max(18),
  expertise: z.array(skillSchema).max(18),
  subclass: slug.nullable(),
  cantrips: z.array(slug).max(10),
  spells: z.array(slug).max(30),
  /** Pour chaque groupe d'équipement de départ, l'index de l'option retenue. */
  equipment: z.array(nonNegative).max(10),
});

export const EMPTY_DRAFT_CHOICES: z.infer<typeof draftChoicesSchema> = {
  name: null,
  species: null,
  class: null,
  background: null,
  abilityMethod: null,
  baseAbilityScores: null,
  chosenSkills: [],
  expertise: [],
  subclass: null,
  cantrips: [],
  spells: [],
  equipment: [],
};

/** Tirage 4d6 (on garde les 3 meilleurs), fait par le serveur. */
export const abilityRollSchema = z.object({
  dice: z.array(z.number().int().min(1).max(6)).length(4),
  total: z.number().int().min(3).max(18),
});

export const characterDraftSchema = z.object({
  id: z.uuid(),
  step: wizardStepSchema,
  choices: draftChoicesSchema,
  /** Les six tirages faits par le serveur, s'il y en a eu. */
  abilityRolls: z.array(abilityRollSchema).length(6).nullable(),
  updatedAt: isoDate,
});

/** Mise à jour partielle d'un brouillon (`PATCH /character-drafts/:id`). */
export const characterDraftUpdateSchema = z.object({
  step: wizardStepSchema.optional(),
  choices: draftChoicesSchema.partial().optional(),
});

export const itemQuantitySchema = z.object({
  slug,
  name: z.string(),
  quantity: z.number().int().min(1),
});

/** Ce que les choix d'origine autorisent pour la suite (`GET /character-drafts/:id/options`). */
export const creationOptionsSchema = z.object({
  skillChoice: z.object({ count: nonNegative, options: z.array(skillSchema) }),
  grantedSkills: z.array(skillSchema),
  expertiseCount: nonNegative,
  originBonuses: z.array(abilityBonusSchema),
  subclass: z.object({
    level: z.number().int(),
    options: z.array(itemQuantitySchema.omit({ quantity: true })),
  }),
  spellcasting: z
    .object({
      ability: abilitySchema,
      cantripsKnown: nonNegative,
      maxSpells: nonNegative,
      maxSpellLevel: nonNegative,
      spellList: z.array(
        z.object({ slug, name: z.string(), level: z.number().int().min(0).max(9) }),
      ),
    })
    .nullable(),
  fixedEquipment: z.array(itemQuantitySchema),
  equipmentChoices: z.array(
    z.object({
      description: z.string(),
      options: z.array(z.object({ label: z.string(), items: z.array(itemQuantitySchema) })),
    }),
  ),
});

// ---------------------------------------------------------------------------
// Fiche de personnage (#33, #34)

const checkSchema = z.object({
  modifier: z.number().int(),
  proficiency: z.enum(["none", "proficient", "expertise"]),
});
const byAbility = <T extends z.ZodType>(value: T) =>
  z.object({ str: value, dex: value, con: value, int: value, wis: value, cha: value });

/** Statistiques calculées par le moteur (`deriveStatistics`). */
export const derivedStatisticsSchema = z.object({
  level: z.number().int(),
  abilityScores: abilityScoresSchema,
  abilityModifiers: byAbility(z.number().int()),
  proficiencyBonus: z.number().int(),
  savingThrows: byAbility(checkSchema),
  skills: z.record(skillSchema, checkSchema),
  armorClass: z.number().int(),
  hasStealthDisadvantage: z.boolean(),
  hitPointMaximum: z.number().int(),
  hitDice: z.object({ die: z.number().int(), count: z.number().int() }),
  initiative: z.number().int(),
  speed: z.number().int(),
  passivePerception: z.number().int(),
  spellcasting: z
    .object({
      ability: abilitySchema,
      saveDc: z.number().int(),
      attackBonus: z.number().int(),
      slots: z.object({
        slots: z.array(z.number().int()),
        pact: z.object({ count: z.number().int(), slotLevel: z.number().int() }).nullable(),
      }),
    })
    .nullable(),
  carrying: z.object({
    weight: z.number(),
    capacity: z.number(),
    encumbrance: z.enum(["none", "encumbered", "heavily-encumbered", "overloaded"]),
  }),
});

export const coinsSchema = z.object({
  cp: nonNegative,
  sp: nonNegative,
  ep: nonNegative,
  gp: nonNegative,
  pp: nonNegative,
});

export const inventoryItemSchema = z.object({
  slug,
  name: z.string(),
  quantity: z.number().int().min(1),
  /** Poids unitaire en livres. */
  weight: z.number().min(0),
  isEquipped: z.boolean(),
});

/** État courant du personnage, qui change en jeu. */
export const characterStateSchema = z.object({
  currentHitPoints: nonNegative,
  temporaryHitPoints: nonNegative,
  hitDiceRemaining: nonNegative,
  /** Emplacements dépensés par niveau de sort (index 0 = 1er niveau). */
  spellSlotsUsed: z.array(nonNegative),
  pactSlotsUsed: nonNegative,
  money: coinsSchema,
  inventory: z.array(inventoryItemSchema),
  notes: z.string().max(10_000),
});

export const attackSchema = z.object({
  slug,
  name: z.string(),
  attackBonus: z.number().int(),
  damage: z.string(),
  damageType: z.string(),
});

export const characterSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  level: z.number().int().min(1).max(20),
  species: itemQuantitySchema.omit({ quantity: true }),
  class: itemQuantitySchema.omit({ quantity: true }),
  background: itemQuantitySchema.omit({ quantity: true }),
  subclass: itemQuantitySchema.omit({ quantity: true }).nullable(),
  statistics: derivedStatisticsSchema,
  state: characterStateSchema,
  features: z.array(z.object({ slug, name: z.string(), level: z.number().int() })),
  cantrips: z.array(itemQuantitySchema.omit({ quantity: true })),
  spells: z.array(itemQuantitySchema.omit({ quantity: true }).extend({ level: z.number().int() })),
  attacks: z.array(attackSchema),
  createdAt: isoDate,
  updatedAt: isoDate,
});

/** Aperçu du récapitulatif : erreurs restantes et statistiques calculées (`GET …/preview`). */
export const creationPreviewSchema = z.object({
  violations: z.array(ruleViolationSchema),
  statistics: derivedStatisticsSchema.nullable(),
});

// ---------------------------------------------------------------------------
// Jets depuis la fiche (#34)

export const rollVisibilitySchema = z.enum(["public", "private", "hidden"]);

export const characterRollRequestSchema = z.object({
  kind: z.enum(["ability", "save", "skill", "initiative", "attack", "damage"]),
  /** Caractéristique, compétence ou slug d'arme, selon le type de jet. */
  key: slug.optional(),
  visibility: rollVisibilitySchema.default("public"),
});

/**
 * Jet tel qu'un destinataire le voit. Pour un jet caché, le joueur sait qu'un jet a eu lieu mais
 * ne reçoit ni les dés ni le total (SEC-08) : `dice` est vide et `total` vaut `null`.
 */
export const characterRollSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  expression: z.string(),
  dice: z.array(z.object({ sides: z.number().int(), value: z.number().int() })),
  modifier: z.number().int(),
  total: z.number().int().nullable(),
  visibility: rollVisibilitySchema,
  rolledAt: isoDate,
});

// ---------------------------------------------------------------------------
// Vie du personnage (#35)

export const characterActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("damage"), amount: z.number().int().min(1).max(1000) }),
  z.object({ type: z.literal("heal"), amount: z.number().int().min(1).max(1000) }),
  z.object({ type: z.literal("temporary-hit-points"), amount: z.number().int().min(0).max(1000) }),
  z.object({ type: z.literal("short-rest"), hitDice: z.number().int().min(0).max(20) }),
  z.object({ type: z.literal("long-rest") }),
  z.object({ type: z.literal("add-item"), slug, quantity: z.number().int().min(1).max(1000) }),
  z.object({ type: z.literal("remove-item"), slug, quantity: z.number().int().min(1).max(1000) }),
  z.object({ type: z.literal("equip-item"), slug, isEquipped: z.boolean() }),
  z.object({
    type: z.literal("money"),
    /** Variation par pièce ; une dépense rend la monnaie depuis les pièces plus grosses. */
    delta: z.object({
      cp: z.number().int().optional(),
      sp: z.number().int().optional(),
      ep: z.number().int().optional(),
      gp: z.number().int().optional(),
      pp: z.number().int().optional(),
    }),
  }),
  z.object({ type: z.literal("notes"), notes: z.string().max(10_000) }),
]);

export const characterHistoryEntrySchema = z.object({
  id: z.uuid(),
  type: z.string(),
  summary: z.string(),
  at: isoDate,
});

// ---------------------------------------------------------------------------
// Montée de niveau (#36)

export const levelUpOptionsSchema = z.object({
  nextLevel: z.number().int(),
  hitDie: z.number().int(),
  averageHitPoints: z.number().int(),
  features: z.array(z.object({ slug, name: z.string() })),
  subclassOptions: z.array(itemQuantitySchema.omit({ quantity: true })),
  abilityScoreImprovement: z.boolean(),
  expertiseCount: nonNegative,
  newCantrips: nonNegative,
  maxSpells: nonNegative,
  spellList: z.array(z.object({ slug, name: z.string(), level: z.number().int().min(0).max(9) })),
});

export const levelUpRequestSchema = z.object({
  hitPointMethod: z.enum(["average", "roll"]),
  subclass: slug.optional(),
  abilityScoreImprovement: z
    .array(abilityBonusSchema.omit({ source: true }))
    .max(2)
    .default([]),
  expertise: z.array(skillSchema).max(4).default([]),
  cantrips: z.array(slug).max(5).default([]),
  /** Liste complète des sorts connus ou préparés après la montée de niveau. */
  spells: z.array(slug).max(30).optional(),
});

export type Ability = z.infer<typeof abilitySchema>;
export type AbilityScores = z.infer<typeof abilityScoresSchema>;
export type AbilityMethod = z.infer<typeof abilityMethodSchema>;
export type RuleViolation = z.infer<typeof ruleViolationSchema>;
export type WizardStep = z.infer<typeof wizardStepSchema>;
export type DraftChoices = z.infer<typeof draftChoicesSchema>;
export type AbilityRoll = z.infer<typeof abilityRollSchema>;
export type CharacterDraft = z.infer<typeof characterDraftSchema>;
export type CharacterDraftUpdate = z.infer<typeof characterDraftUpdateSchema>;
export type CreationOptions = z.infer<typeof creationOptionsSchema>;
export type DerivedStatisticsContract = z.infer<typeof derivedStatisticsSchema>;
export type CreationPreview = z.infer<typeof creationPreviewSchema>;
export type Coins = z.infer<typeof coinsSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type CharacterState = z.infer<typeof characterStateSchema>;
export type Attack = z.infer<typeof attackSchema>;
export type Character = z.infer<typeof characterSchema>;
export type RollVisibility = z.infer<typeof rollVisibilitySchema>;
export type CharacterRollRequest = z.infer<typeof characterRollRequestSchema>;
export type CharacterRoll = z.infer<typeof characterRollSchema>;
export type CharacterAction = z.infer<typeof characterActionSchema>;
export type CharacterHistoryEntry = z.infer<typeof characterHistoryEntrySchema>;
export type LevelUpOptions = z.infer<typeof levelUpOptionsSchema>;
export type LevelUpRequest = z.infer<typeof levelUpRequestSchema>;
