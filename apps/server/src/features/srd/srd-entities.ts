import { schema } from "@epiquest/db";
import type { SrdEntity, SrdFilters } from "@epiquest/schemas";
import { eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import { QueryBuilder, type PgColumn, type PgTable } from "drizzle-orm/pg-core";

/** Colonnes communes à toutes les tables du SRD (voir apps/db/README.md). */
export type SrdTable = PgTable & {
  id: PgColumn;
  slug: PgColumn;
  name: PgColumn;
  description: PgColumn;
  raw: PgColumn;
  search: PgColumn;
};

interface EntityConfig<E extends SrdEntity> {
  table: SrdTable;
  /** Colonnes renvoyées dans les listes, en plus de `id`, `slug` et `name`. */
  summary: Record<string, PgColumn>;
  /** Conditions SQL déduites des filtres validés. */
  filters: (filters: SrdFilters<E>) => (SQL | undefined)[];
}

const {
  srdBackgrounds,
  srdClasses,
  srdConditions,
  srdItems,
  srdMonsters,
  srdSpecies,
  srdSpellClasses,
  srdSpells,
  srdSubclasses,
} = schema;

// Constructeur de requêtes sans connexion : sert aux sous-requêtes des filtres.
const queryBuilder = new QueryBuilder();

/** Sous-requête : identifiant de la classe désignée par son slug. */
function classIds(classSlug: string) {
  return queryBuilder
    .select({ id: srdClasses.id })
    .from(srdClasses)
    .where(eq(srdClasses.slug, classSlug));
}

/** Sous-requête : sorts accessibles à la classe désignée par son slug. */
function spellIdsForClass(classSlug: string) {
  return queryBuilder
    .select({ id: srdSpellClasses.spellId })
    .from(srdSpellClasses)
    .innerJoin(srdClasses, eq(srdSpellClasses.classId, srdClasses.id))
    .where(eq(srdClasses.slug, classSlug));
}

/** Configuration de chaque entité : table, colonnes des listes et filtres. */
export const SRD_ENTITIES: { [E in SrdEntity]: EntityConfig<E> } = {
  species: {
    table: srdSpecies,
    summary: { size: srdSpecies.size, speed: srdSpecies.speed },
    filters: () => [],
  },
  classes: {
    table: srdClasses,
    summary: { hitDie: srdClasses.hitDie },
    filters: () => [],
  },
  subclasses: {
    table: srdSubclasses,
    summary: {},
    filters: (filters) => [
      filters.class ? inArray(srdSubclasses.classId, classIds(filters.class)) : undefined,
    ],
  },
  backgrounds: { table: srdBackgrounds, summary: {}, filters: () => [] },
  spells: {
    table: srdSpells,
    summary: {
      level: srdSpells.level,
      school: srdSpells.school,
      isRitual: srdSpells.isRitual,
      requiresConcentration: srdSpells.requiresConcentration,
    },
    filters: (filters) => [
      filters.level === undefined ? undefined : eq(srdSpells.level, filters.level),
      filters.school ? eq(srdSpells.school, filters.school) : undefined,
      filters.class ? inArray(srdSpells.id, spellIdsForClass(filters.class)) : undefined,
    ],
  },
  items: {
    table: srdItems,
    summary: { kind: srdItems.kind, category: srdItems.category, rarity: srdItems.rarity },
    filters: (filters) => [
      filters.kind ? eq(srdItems.kind, filters.kind) : undefined,
      filters.category ? eq(srdItems.category, filters.category) : undefined,
      filters.rarity ? eq(srdItems.rarity, filters.rarity.toLowerCase()) : undefined,
    ],
  },
  monsters: {
    table: srdMonsters,
    summary: {
      size: srdMonsters.size,
      type: srdMonsters.type,
      challengeRating: srdMonsters.challengeRating,
      armorClass: srdMonsters.armorClass,
      hitPoints: srdMonsters.hitPoints,
    },
    filters: (filters) => [
      filters.type ? eq(srdMonsters.type, filters.type) : undefined,
      filters.size ? eq(srdMonsters.size, filters.size) : undefined,
      filters.minChallengeRating === undefined
        ? undefined
        : gte(srdMonsters.challengeRating, filters.minChallengeRating),
      filters.maxChallengeRating === undefined
        ? undefined
        : lte(srdMonsters.challengeRating, filters.maxChallengeRating),
    ],
  },
  conditions: { table: srdConditions, summary: {}, filters: () => [] },
};
