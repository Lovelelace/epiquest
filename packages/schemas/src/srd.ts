import { z } from "zod";

/** Entités du SRD consultables par l'API (`GET /srd/<entité>`). */
export const srdEntitySchema = z.enum([
  "species",
  "classes",
  "subclasses",
  "backgrounds",
  "spells",
  "items",
  "monsters",
  "conditions",
]);

/** Taille de page maximale des listes du SRD. */
export const SRD_MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const slug = z.string().trim().min(1).max(100);

/** Paramètres communs des listes : recherche par nom ou texte et pagination. */
export const srdListQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(SRD_MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

const sizeSchema = z.enum(["tiny", "small", "medium", "large", "huge", "gargantuan"]);

/** Filtres propres à chaque entité, ajoutés aux paramètres communs. */
export const srdFilterSchemas = {
  species: z.object({}),
  classes: z.object({}),
  subclasses: z.object({ class: slug.optional() }),
  backgrounds: z.object({}),
  spells: z.object({
    level: z.coerce.number().int().min(0).max(9).optional(),
    school: slug.optional(),
    class: slug.optional(),
  }),
  items: z.object({
    kind: z.enum(["equipment", "magic_item"]).optional(),
    category: slug.optional(),
    rarity: z.string().trim().min(1).optional(),
  }),
  monsters: z.object({
    type: slug.optional(),
    size: sizeSchema.optional(),
    minChallengeRating: z.coerce.number().min(0).optional(),
    maxChallengeRating: z.coerce.number().min(0).optional(),
  }),
  conditions: z.object({}),
} satisfies Record<z.infer<typeof srdEntitySchema>, z.ZodObject>;

const entrySummary = z.object({ id: z.uuid(), slug: z.string(), name: z.string() });

/** Champs renvoyés dans les listes, par entité. */
export const srdSummarySchemas = {
  species: entrySummary.extend({
    size: sizeSchema.nullable(),
    speed: z.number().int().nullable(),
  }),
  classes: entrySummary.extend({ hitDie: z.number().int() }),
  subclasses: entrySummary,
  backgrounds: entrySummary,
  spells: entrySummary.extend({
    level: z.number().int(),
    school: z.string(),
    isRitual: z.boolean(),
    requiresConcentration: z.boolean(),
  }),
  items: entrySummary.extend({
    kind: z.enum(["equipment", "magic_item"]),
    category: z.string(),
    rarity: z.string().nullable(),
  }),
  monsters: entrySummary.extend({
    size: sizeSchema,
    type: z.string(),
    challengeRating: z.number(),
    armorClass: z.number().int(),
    hitPoints: z.number().int(),
  }),
  conditions: entrySummary,
} satisfies Record<z.infer<typeof srdEntitySchema>, z.ZodObject>;

/** Détail d'une entrée : résumé, texte de règles et données complètes de la source. */
export const srdDetailExtension = {
  description: z.string(),
  data: z.record(z.string(), z.unknown()),
};

/** Page de résultats. */
export function srdPageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
}

/** Version du SRD importée en base (`GET /srd/version`). */
export const srdVersionSchema = z.object({
  srdVersion: z.string(),
  sourceRepository: z.string(),
  sourceRef: z.string(),
  sourceCommit: z.string(),
  importedAt: z.iso.datetime({ offset: true }),
});

export type SrdEntity = z.infer<typeof srdEntitySchema>;
export type SrdListQuery = z.infer<typeof srdListQuerySchema>;
export type SrdFilters<E extends SrdEntity> = z.infer<(typeof srdFilterSchemas)[E]>;
export type SrdSummary<E extends SrdEntity> = z.infer<(typeof srdSummarySchemas)[E]>;
export type SrdDetail<E extends SrdEntity> = SrdSummary<E> & {
  description: string;
  data: Record<string, unknown>;
};
export interface SrdPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
export type SrdVersion = z.infer<typeof srdVersionSchema>;
