import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { srdDataFolder } from "../paths.js";
import { sourceMonsterActionSchema } from "./monster-attacks.js";

/** Référence vers une autre entrée de la source (`{ index, name, url }`). */
const reference = z.looseObject({ index: z.string().min(1) });
const paragraphs = z.union([z.string(), z.array(z.string())]).nullish();

const entry = { index: z.string().min(1), name: z.string().min(1) };

export const sourceSchemas = {
  races: z.looseObject({
    ...entry,
    size: z.string(),
    speed: z.number().int(),
  }),
  subraces: z.looseObject({ ...entry, race: reference, desc: paragraphs }),
  classes: z.looseObject({ ...entry, hit_die: z.number().int() }),
  subclasses: z.looseObject({ ...entry, class: reference, desc: paragraphs }),
  backgrounds: z.looseObject({
    ...entry,
    feature: z.looseObject({ desc: paragraphs }).optional(),
  }),
  spells: z.looseObject({
    ...entry,
    desc: paragraphs,
    level: z.number().int(),
    school: reference,
    casting_time: z.string(),
    range: z.string(),
    duration: z.string(),
    ritual: z.boolean(),
    concentration: z.boolean(),
    classes: z.array(reference),
  }),
  equipment: z.looseObject({ ...entry, desc: paragraphs, equipment_category: reference }),
  magicItems: z.looseObject({
    ...entry,
    desc: paragraphs,
    equipment_category: reference,
    rarity: z.looseObject({ name: z.string() }),
  }),
  monsters: z.looseObject({
    ...entry,
    desc: paragraphs,
    size: z.string(),
    type: z.string(),
    challenge_rating: z.number().nonnegative(),
    armor_class: z.array(z.looseObject({ value: z.number().int() })).min(1),
    hit_points: z.number().int().positive(),
    actions: z.array(sourceMonsterActionSchema).default([]),
  }),
  conditions: z.looseObject({ ...entry, desc: paragraphs }),
};

type SourceSchemas = typeof sourceSchemas;
export type SrdSource = { [K in keyof SourceSchemas]: z.infer<SourceSchemas[K]>[] };

function readEntries<T extends z.ZodType>(file: string, schema: T, folder: string): z.infer<T>[] {
  const content: unknown = JSON.parse(readFileSync(join(folder, file), "utf8"));
  const result = z.array(schema).safeParse(content);
  if (!result.success) {
    throw new Error(`Fichier SRD invalide (${file}) : ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** Lit et valide les fichiers sources du SRD (DATA-05). Échoue si un fichier est invalide. */
export function loadSrdSource(folder: string = srdDataFolder): SrdSource {
  return {
    races: readEntries("5e-SRD-Races.json", sourceSchemas.races, folder),
    subraces: readEntries("5e-SRD-Subraces.json", sourceSchemas.subraces, folder),
    classes: readEntries("5e-SRD-Classes.json", sourceSchemas.classes, folder),
    subclasses: readEntries("5e-SRD-Subclasses.json", sourceSchemas.subclasses, folder),
    backgrounds: readEntries("5e-SRD-Backgrounds.json", sourceSchemas.backgrounds, folder),
    spells: readEntries("5e-SRD-Spells.json", sourceSchemas.spells, folder),
    equipment: readEntries("5e-SRD-Equipment.json", sourceSchemas.equipment, folder),
    magicItems: readEntries("5e-SRD-Magic-Items.json", sourceSchemas.magicItems, folder),
    monsters: readEntries("5e-SRD-Monsters.json", sourceSchemas.monsters, folder),
    conditions: readEntries("5e-SRD-Conditions.json", sourceSchemas.conditions, folder),
  };
}
