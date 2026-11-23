import {
  type AbilityBonus,
  type ArmorData,
  type ClassData,
  classProgression,
  isSkill,
  type Skill,
  SPECIES_TRAIT_HIT_POINTS_PER_LEVEL,
  SPECIES_TRAIT_SKILLS,
  type SpeciesData,
} from "@epiquest/rules";
import { abilitySchema, type CreationOptions } from "@epiquest/schemas";
import { z } from "zod";

/**
 * Traduction des données brutes du SRD (format 5e-bits) vers les types du moteur de règles et
 * les options de création. Fonctions pures : les données sont chargées par `CreationRulesService`.
 */

export interface SrdEntry {
  slug: string;
  name: string;
  data: Record<string, unknown>;
}

const reference = z.looseObject({ index: z.string(), name: z.string().optional() });
const abilityBonuses = z
  .array(
    z.looseObject({
      ability_score: z.looseObject({ index: abilitySchema }),
      bonus: z.number().int(),
    }),
  )
  .default([]);

const raceSchema = z.looseObject({
  speed: z.number().int().optional(),
  ability_bonuses: abilityBonuses,
  traits: z.array(reference).default([]),
  racial_traits: z.array(reference).default([]),
  race: reference.optional(),
});

const classSchema = z.looseObject({
  hit_die: z.number().int(),
  saving_throws: z.array(z.looseObject({ index: abilitySchema })),
  proficiency_choices: z
    .array(
      z.looseObject({
        choose: z.number().int(),
        type: z.string(),
        from: z.looseObject({
          options: z.array(z.looseObject({ item: reference.optional() })).default([]),
        }),
      }),
    )
    .default([]),
});

const backgroundSchema = z.looseObject({ starting_proficiencies: z.array(reference).default([]) });

/** « skill-sleight-of-hand » → « sleight-of-hand », ou `null` si ce n'est pas une compétence. */
export function skillFromProficiency(index: string): Skill | null {
  const skill = index.replace(/^skill-/, "");
  return index.startsWith("skill-") && isSkill(skill) ? skill : null;
}

function skills(references: { index: string }[]): Skill[] {
  return references.flatMap((entry) => {
    const skill = skillFromProficiency(entry.index);
    return skill ? [skill] : [];
  });
}

/** Espèce choisie (sous-espèce comprise) : données du moteur, bonus et compétences données. */
export function mapSpecies(chosen: SrdEntry, parent: SrdEntry | null) {
  const own = raceSchema.parse(chosen.data);
  const base = parent ? raceSchema.parse(parent.data) : own;
  const traits = [...base.traits, ...own.racial_traits, ...(parent ? own.traits : [])].map(
    (trait) => trait.index,
  );
  const bonuses: AbilityBonus[] = [
    ...(parent ? base.ability_bonuses : []),
    ...own.ability_bonuses,
  ].map((bonus) => ({
    ability: bonus.ability_score.index,
    amount: bonus.bonus,
    source: "species",
  }));
  const species: SpeciesData = {
    index: chosen.slug,
    speed: own.speed ?? base.speed ?? 30,
    hitPointBonusPerLevel: traits.reduce(
      (total, trait) => total + (SPECIES_TRAIT_HIT_POINTS_PER_LEVEL[trait] ?? 0),
      0,
    ),
  };
  return {
    species,
    bonuses,
    grantedSkills: traits.flatMap((trait) => SPECIES_TRAIT_SKILLS[trait] ?? []),
  };
}

/** Classe : données du moteur et choix de compétences. */
export function mapClass(entry: SrdEntry) {
  const raw = classSchema.parse(entry.data);
  const progression = classProgression(entry.slug);
  const classData: ClassData = {
    index: entry.slug,
    hitDie: raw.hit_die,
    savingThrows: raw.saving_throws.map((save) => save.index),
    spellcasting: progression.spellcasting
      ? {
          ability: progression.spellcasting.ability,
          progression: progression.spellcasting.progression,
        }
      : null,
    unarmoredDefense: progression.unarmoredDefense,
  };
  const choice = raw.proficiency_choices.find((option) =>
    option.from.options.some((item) => item.item && skillFromProficiency(item.item.index)),
  );
  const options = skills(
    choice?.from.options.flatMap((item) => (item.item ? [item.item] : [])) ?? [],
  );
  return { classData, progression, skillChoice: { count: choice?.choose ?? 0, options } };
}

export function backgroundSkills(entry: SrdEntry): Skill[] {
  return skills(backgroundSchema.parse(entry.data).starting_proficiencies);
}

const armorSchema = z.looseObject({
  armor_category: z.string(),
  armor_class: z.looseObject({
    base: z.number().int(),
    dex_bonus: z.boolean(),
    max_bonus: z.number().int().optional(),
  }),
  str_minimum: z.number().int().default(0),
  stealth_disadvantage: z.boolean().default(false),
});

const CATEGORY_TO_ARMOR: Record<string, ArmorData["category"]> = {
  Light: "light",
  Medium: "medium",
  Heavy: "heavy",
};

/** Armure du SRD, ou `null` pour un bouclier ou un objet qui n'est pas une armure. */
export function mapArmor(data: Record<string, unknown>): ArmorData | null {
  const parsed = armorSchema.safeParse(data);
  if (!parsed.success) return null;
  const category = CATEGORY_TO_ARMOR[parsed.data.armor_category];
  if (!category) return null;
  const { armor_class: armorClass } = parsed.data;
  return {
    category,
    baseArmorClass: armorClass.base,
    dexterityCap: category === "heavy" ? 0 : (armorClass.max_bonus ?? null),
    strengthRequirement: parsed.data.str_minimum > 0 ? parsed.data.str_minimum : null,
    hasStealthDisadvantage: parsed.data.stealth_disadvantage,
  };
}

export function isShield(data: Record<string, unknown>): boolean {
  return data.armor_category === "Shield";
}

export function itemWeight(data: Record<string, unknown>): number {
  return typeof data.weight === "number" ? data.weight : 0;
}

// ---------------------------------------------------------------------------
// Équipement de départ

type EquipmentChoice = CreationOptions["equipmentChoices"][number];
type ItemQuantity = EquipmentChoice["options"][number]["items"][number];

const optionSchema: z.ZodType<RawOption> = z.lazy(() =>
  z.looseObject({
    option_type: z.string(),
    count: z.number().int().optional(),
    of: reference.optional(),
    items: z.array(optionSchema).optional(),
    choice: z
      .looseObject({
        choose: z.number().int().default(1),
        desc: z.string().optional(),
        from: z.looseObject({ equipment_category: reference.optional() }),
      })
      .optional(),
  }),
);
interface RawOption {
  option_type: string;
  count?: number | undefined;
  of?: { index: string; name?: string | undefined } | undefined;
  items?: RawOption[] | undefined;
  choice?:
    | {
        choose: number;
        desc?: string | undefined;
        from: { equipment_category?: { index: string } | undefined };
      }
    | undefined;
}
const optionSetSchema = z.looseObject({
  desc: z.string().optional(),
  choose: z.number().int().default(1),
  from: z.looseObject({
    option_set_type: z.string(),
    options: z.array(optionSchema).optional(),
    equipment_category: reference.optional(),
  }),
});
const startingEquipmentSchema = z
  .array(z.looseObject({ equipment: reference, quantity: z.number().int() }))
  .default([]);

/** Résout un objet par son slug : nom affiché et présence dans le SRD. */
export type ItemLookup = (slug: string) => SrdEntry | undefined;

/** Les objets d'une catégorie d'équipement (« holy-symbols », « martial-melee-weapons »…). */
export function itemsInCategory(category: string, items: SrdEntry[]): SrdEntry[] {
  return items.filter((item) => {
    const data = item.data;
    const matches = (value: unknown) =>
      typeof value === "object" && value !== null && "index" in value && value.index === category;
    const range =
      typeof data.category_range === "string"
        ? data.category_range.toLowerCase().replace(" ", "-")
        : "";
    const weapon =
      typeof data.weapon_category === "string" ? data.weapon_category.toLowerCase() : "";
    return (
      matches(data.gear_category) ||
      matches(data.equipment_category) ||
      matches(data.tool_category) ||
      `${range}-weapons` === category ||
      `${weapon}-weapons` === category
    );
  });
}

function counted(slug: string, quantity: number, lookup: ItemLookup): ItemQuantity[] {
  const item = lookup(slug);
  return item ? [{ slug, name: item.name, quantity }] : [];
}

function expandOption(
  option: RawOption,
  lookup: ItemLookup,
  items: SrdEntry[],
): { label: string; items: ItemQuantity[] }[] {
  if (option.option_type === "counted_reference" && option.of) {
    const resolved = counted(option.of.index, option.count ?? 1, lookup);
    return resolved.length
      ? [
          {
            label: resolved.map((item) => `${item.quantity} × ${item.name}`).join(", "),
            items: resolved,
          },
        ]
      : [];
  }
  if (option.option_type === "multiple" && option.items) {
    const parts = option.items.flatMap((part) => expandOption(part, lookup, items));
    // Une option « multiple » qui contient un choix est réduite à son premier objet de chaque partie.
    const resolved = parts.flatMap((part) => part.items.slice(0, 1));
    return [
      {
        label: resolved.map((item) => `${item.quantity} × ${item.name}`).join(", "),
        items: resolved,
      },
    ];
  }
  if (option.option_type === "choice" && option.choice?.from.equipment_category) {
    return itemsInCategory(option.choice.from.equipment_category.index, items).map((item) => ({
      label: `${option.choice?.choose ?? 1} × ${item.name}`,
      items: [{ slug: item.slug, name: item.name, quantity: option.choice?.choose ?? 1 }],
    }));
  }
  return [];
}

/** Équipement de départ fixe et groupes de choix d'une classe et d'un historique. */
export function startingEquipment(sources: SrdEntry[], items: SrdEntry[]) {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const lookup: ItemLookup = (slug) => bySlug.get(slug);
  const fixedEquipment: ItemQuantity[] = [];
  const equipmentChoices: EquipmentChoice[] = [];
  for (const source of sources) {
    for (const entry of startingEquipmentSchema.parse(source.data.starting_equipment)) {
      fixedEquipment.push(...counted(entry.equipment.index, entry.quantity, lookup));
    }
    const optionSets = z
      .array(optionSetSchema)
      .default([])
      .parse(source.data.starting_equipment_options);
    for (const set of optionSets) {
      const options = set.from.equipment_category
        ? expandOption(
            { option_type: "choice", choice: { choose: set.choose, from: set.from } },
            lookup,
            items,
          )
        : (set.from.options ?? []).flatMap((option) => expandOption(option, lookup, items));
      if (options.length > 0) {
        equipmentChoices.push({
          description: set.desc ?? `${source.name} : équipement au choix`,
          options,
        });
      }
    }
  }
  return { fixedEquipment, equipmentChoices };
}
