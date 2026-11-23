import { z } from "zod";
import { diceNotationSchema } from "./dice.js";

/** Caractéristiques, par leur abréviation du SRD. */
export const abilitySchema = z.enum(["str", "dex", "con", "int", "wis", "cha"]);

/** Types de dégâts du SRD 5.1. */
export const damageTypeSchema = z.enum([
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
]);

/** États du SRD 5.1, par leur slug en base (table `srd_conditions`). */
export const conditionSchema = z.enum([
  "blinded",
  "charmed",
  "deafened",
  "exhaustion",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
]);

const feet = z.number().int().positive();

/** Durée d'un effet. Absente : l'effet est instantané. */
export const durationSchema = z.object({
  amount: z.number().int().positive(),
  unit: z.enum(["round", "minute", "hour", "day"]),
});

/** Dégâts. `perSlotLevel` : dés ajoutés par niveau d'emplacement au-dessus du niveau du sort. */
export const damageEffectSchema = z.object({
  type: z.literal("damage"),
  dice: diceNotationSchema,
  damageType: damageTypeSchema,
  perSlotLevel: diceNotationSchema.optional(),
});

/** Soins. `addAbilityModifier` : ajoute le modificateur de la caractéristique d'incantation. */
export const healingEffectSchema = z.object({
  type: z.literal("healing"),
  dice: diceNotationSchema,
  addAbilityModifier: z.boolean().default(false),
  perSlotLevel: diceNotationSchema.optional(),
});

/** Application d'un état. `repeatSave` : la cible refait le jet à la fin de chacun de ses tours. */
export const applyConditionEffectSchema = z.object({
  type: z.literal("apply_condition"),
  condition: conditionSchema,
  duration: durationSchema.optional(),
  repeatSave: z.boolean().default(false),
});

/** Modificateur temporaire ou permanent d'une valeur de jeu (bonus ou malus). */
export const modifierEffectSchema = z.object({
  type: z.literal("modifier"),
  target: z.enum([
    "armor_class",
    "attack_roll",
    "damage_roll",
    "saving_throw",
    "ability_check",
    "speed",
  ]),
  value: z.union([z.number().int(), diceNotationSchema]),
  ability: abilitySchema.optional(),
  duration: durationSchema.optional(),
});

/** Effets appliqués à une cible : conséquence d'une attaque, d'un jet de sauvegarde ou directs. */
export const outcomeEffectSchema = z.discriminatedUnion("type", [
  damageEffectSchema,
  healingEffectSchema,
  applyConditionEffectSchema,
  modifierEffectSchema,
]);

/**
 * Jet d'attaque. `attackBonus` absent : bonus d'attaque de l'auteur (sort, arme maniée).
 * Un monstre du SRD a un bonus fixe.
 */
export const attackEffectSchema = z.object({
  type: z.literal("attack"),
  kind: z.enum(["melee_weapon", "ranged_weapon", "melee_spell", "ranged_spell"]),
  attackBonus: z.number().int().optional(),
  reach: feet.optional(),
  range: z.object({ normal: feet, long: feet.optional() }).optional(),
  onHit: z.array(outcomeEffectSchema).min(1),
  onMiss: z.array(outcomeEffectSchema).default([]),
});

/**
 * Jet de sauvegarde imposé à la cible. `dc` absent : DD des sorts de l'auteur.
 * `halfDamageOnSuccess` : une sauvegarde réussie divise les dégâts de `onFail` par deux.
 */
export const savingThrowEffectSchema = z.object({
  type: z.literal("saving_throw"),
  ability: abilitySchema,
  dc: z.number().int().positive().optional(),
  onFail: z.array(outcomeEffectSchema).min(1),
  onSuccess: z.array(outcomeEffectSchema).default([]),
  halfDamageOnSuccess: z.boolean().default(false),
});

/** Un effet de jeu : résolution (attaque, sauvegarde) ou conséquence directe. */
export const effectSchema = z.discriminatedUnion("type", [
  attackEffectSchema,
  savingThrowEffectSchema,
  ...outcomeEffectSchema.options,
]);

/** Zone d'effet, en pieds (taille = rayon, côté ou longueur selon la forme). */
export const areaSchema = z.object({
  shape: z.enum(["sphere", "cone", "cube", "cylinder", "line"]),
  size: feet,
});

/**
 * Ce que fait un sort, une capacité ou une attaque de monstre quand on l'utilise : son coût en
 * action, sa portée, sa zone et ses effets, résolus dans l'ordre.
 */
export const actionEffectsSchema = z.object({
  activation: z.enum(["action", "bonus_action", "reaction"]),
  range: z.union([z.literal("self"), z.literal("touch"), feet]).optional(),
  area: areaSchema.optional(),
  requiresConcentration: z.boolean().default(false),
  effects: z.array(effectSchema).min(1),
});

export type Ability = z.infer<typeof abilitySchema>;
export type DamageType = z.infer<typeof damageTypeSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type Duration = z.infer<typeof durationSchema>;
export type DamageEffect = z.infer<typeof damageEffectSchema>;
export type HealingEffect = z.infer<typeof healingEffectSchema>;
export type ApplyConditionEffect = z.infer<typeof applyConditionEffectSchema>;
export type ModifierEffect = z.infer<typeof modifierEffectSchema>;
export type OutcomeEffect = z.infer<typeof outcomeEffectSchema>;
export type AttackEffect = z.infer<typeof attackEffectSchema>;
export type SavingThrowEffect = z.infer<typeof savingThrowEffectSchema>;
export type Effect = z.infer<typeof effectSchema>;
export type Area = z.infer<typeof areaSchema>;
export type ActionEffects = z.infer<typeof actionEffectsSchema>;
/** Forme acceptée en entrée, avant application des valeurs par défaut. */
export type ActionEffectsInput = z.input<typeof actionEffectsSchema>;
