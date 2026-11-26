import {
  type AbilityBonus,
  type CharacterBuild,
  type ClassData,
  classProgression,
  deriveStatistics,
  type Skill,
  type SpeciesData,
} from "@epiquest/rules";
import {
  characterSchema,
  type Attack,
  type Character,
  type CharacterState,
  type InventoryItem,
} from "@epiquest/schemas";
import { z } from "zod";
import { isShield, itemWeight, mapArmor, type SrdEntry } from "./srd-mapping.js";

/** Choix définitifs d'un personnage créé, enregistrés en base (`characters.choices`). */
export const storedChoicesSchema = z.object({
  abilityMethod: z.enum(["point-buy", "standard-array", "rolled"]),
  baseAbilityScores: z.object({
    str: z.number().int(),
    dex: z.number().int(),
    con: z.number().int(),
    int: z.number().int(),
    wis: z.number().int(),
    cha: z.number().int(),
  }),
  abilityBonuses: z.array(
    z.object({
      ability: z.enum(["str", "dex", "con", "int", "wis", "cha"]),
      amount: z.number().int(),
      source: z.enum(["species", "background", "ability-score-improvement"]),
    }),
  ),
  skillProficiencies: z.array(z.string()),
  expertise: z.array(z.string()),
  cantrips: z.array(z.string()),
  spells: z.array(z.string()),
  hitPointGains: z.array(z.number().int()),
});
export type StoredChoices = z.infer<typeof storedChoicesSchema>;

export interface CharacterRecord {
  id: string;
  name: string;
  level: number;
  subclassSlug: string | null;
  choices: StoredChoices;
  state: CharacterState;
  createdAt: Date;
  updatedAt: Date;
}

/** Données SRD nécessaires pour afficher un personnage. */
export interface CharacterReferences {
  species: SrdEntry;
  speciesData: SpeciesData;
  characterClass: SrdEntry;
  classData: ClassData;
  background: SrdEntry;
  subclass: SrdEntry | null;
  spells: Map<string, SrdEntry>;
  items: Map<string, SrdEntry>;
}

const weaponSchema = z.looseObject({
  weapon_range: z.string(),
  damage: z
    .looseObject({ damage_dice: z.string(), damage_type: z.looseObject({ name: z.string() }) })
    .optional(),
  properties: z.array(z.looseObject({ index: z.string() })).default([]),
});

function equipped(state: CharacterState, references: CharacterReferences) {
  return state.inventory
    .filter((item) => item.isEquipped)
    .flatMap((item) => {
      const entry = references.items.get(item.slug);
      return entry ? [entry] : [];
    });
}

/** Entrée du moteur de règles à partir du personnage enregistré et de l'état courant. */
export function toBuild(record: CharacterRecord, references: CharacterReferences): CharacterBuild {
  const worn = equipped(record.state, references);
  const armor = worn.map((entry) => mapArmor(entry.data)).find((data) => data !== null) ?? null;
  return {
    level: record.level,
    classData: references.classData,
    species: references.speciesData,
    baseAbilityScores: record.choices.baseAbilityScores,
    abilityBonuses: record.choices.abilityBonuses as AbilityBonus[],
    skillProficiencies: record.choices.skillProficiencies as Skill[], // validés à la création
    skillExpertise: record.choices.expertise as Skill[],
    hitPointGains: record.choices.hitPointGains,
    armor,
    hasShield: worn.some((entry) => isShield(entry.data)),
    armorClassBonuses: [],
    carriedWeight: inventoryWeight(record.state.inventory),
  };
}

export function inventoryWeight(inventory: InventoryItem[]): number {
  return (
    Math.round(inventory.reduce((total, item) => total + item.weight * item.quantity, 0) * 100) /
    100
  );
}

function signed(value: number): string {
  return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

/** Attaques des armes équipées : bonus d'attaque et dégâts, Force ou Dextérité selon l'arme. */
export function weaponAttacks(
  state: CharacterState,
  references: CharacterReferences,
  statistics: ReturnType<typeof deriveStatistics>,
): Attack[] {
  const { str, dex } = statistics.abilityModifiers;
  return equipped(state, references).flatMap((entry) => {
    const weapon = weaponSchema.safeParse(entry.data);
    if (!weapon.success || !weapon.data.damage) return [];
    const isFinesse = weapon.data.properties.some((property) => property.index === "finesse");
    const isRanged = weapon.data.weapon_range === "Ranged";
    const modifier = isFinesse ? Math.max(str, dex) : isRanged ? dex : str;
    return [
      {
        slug: entry.slug,
        name: entry.name,
        attackBonus: statistics.proficiencyBonus + modifier,
        damage: `${weapon.data.damage.damage_dice} ${signed(modifier)}`,
        damageType: weapon.data.damage.damage_type.name,
      },
    ];
  });
}

function named(entry: SrdEntry): { slug: string; name: string } {
  return { slug: entry.slug, name: entry.name };
}

/** Fiche complète renvoyée au client, statistiques calculées par le moteur. */
export function toCharacter(record: CharacterRecord, references: CharacterReferences): Character {
  const statistics = deriveStatistics(toBuild(record, references));
  const progression = classProgression(references.classData.index);
  const features = Object.entries(progression.features)
    .filter(([level]) => Number(level) <= record.level)
    .flatMap(([level, list]) => list.map((feature) => ({ ...feature, level: Number(level) })));
  const spell = (slug: string) => references.spells.get(slug);
  return characterSchema.parse({
    id: record.id,
    name: record.name,
    level: record.level,
    species: named(references.species),
    class: named(references.characterClass),
    background: named(references.background),
    subclass: references.subclass ? named(references.subclass) : null,
    statistics,
    state: record.state,
    features,
    cantrips: record.choices.cantrips.flatMap((slug) => {
      const entry = spell(slug);
      return entry ? [named(entry)] : [];
    }),
    spells: record.choices.spells.flatMap((slug) => {
      const entry = spell(slug);
      return entry ? [{ ...named(entry), level: Number(entry.data.level) }] : [];
    }),
    attacks: weaponAttacks(record.state, references, statistics),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

/** Objet d'inventaire à partir d'une entrée du SRD ; armures, boucliers et armes sont équipés. */
export function inventoryItem(entry: SrdEntry, quantity: number): InventoryItem {
  const isWearable =
    mapArmor(entry.data) !== null || isShield(entry.data) || "weapon_range" in entry.data;
  return {
    slug: entry.slug,
    name: entry.name,
    quantity,
    weight: itemWeight(entry.data),
    isEquipped: isWearable,
  };
}
