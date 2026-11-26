import { getTableColumns, inArray, sql, type SQL } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT, PgTable } from "drizzle-orm/pg-core";
import * as schema from "../schema/index.js";
import {
  mapBackground,
  mapClass,
  mapCondition,
  mapEquipment,
  mapMagicItem,
  mapMonster,
  mapRace,
  mapSpell,
  mapSubclass,
  mapSubrace,
} from "./mappers.js";
import { reportMonsterAttacks, type MonsterAttackReport } from "./monster-attacks.js";
import { loadSrdSource, type SrdSource } from "./source.js";
import { SRD_SOURCE } from "./version.js";

/** Bilan d'un import du SRD. */
export interface SrdImportReport {
  monsterAttacks: MonsterAttackReport;
}

/** Toute base Drizzle PostgreSQL (postgres.js en production, PGlite dans les tests). */
export type SrdDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;
type Transaction = Parameters<Parameters<SrdDatabase["transaction"]>[0]>[0];

const {
  srdBackgrounds,
  srdClasses,
  srdConditions,
  srdImports,
  srdItems,
  srdMonsters,
  srdSpecies,
  srdSpellClasses,
  srdSpells,
  srdSubclasses,
} = schema;

/**
 * Colonnes à réécrire quand une entrée existe déjà : toutes sauf l'identifiant, le slug et les
 * colonnes calculées. L'UUID d'une entrée ne change donc jamais d'un import à l'autre.
 */
function updateOnConflict(table: PgTable): Record<string, SQL> {
  const set: Record<string, SQL> = {};
  for (const [key, column] of Object.entries(getTableColumns(table))) {
    if (key === "id" || key === "slug" || column.generated) continue;
    set[key] = sql.raw(`excluded."${column.name}"`);
  }
  return set;
}

/** Associe chaque slug à l'UUID de sa ligne. */
function idsBySlug(rows: { id: string; slug: string }[]): Map<string, string> {
  return new Map(rows.map((row) => [row.slug, row.id]));
}

function requireId(ids: Map<string, string>, slug: string, context: string): string {
  const id = ids.get(slug);
  if (!id) throw new Error(`Référence inconnue dans le SRD : ${context} → « ${slug} »`);
  return id;
}

async function importClasses(tx: Transaction, source: SrdSource) {
  const classes = await tx
    .insert(srdClasses)
    .values(source.classes.map(mapClass))
    .onConflictDoUpdate({ target: srdClasses.slug, set: updateOnConflict(srdClasses) })
    .returning({ id: srdClasses.id, slug: srdClasses.slug });
  const classIds = idsBySlug(classes);

  await tx
    .insert(srdSubclasses)
    .values(
      source.subclasses.map((subclass) =>
        mapSubclass(subclass, requireId(classIds, subclass.class.index, subclass.index)),
      ),
    )
    .onConflictDoUpdate({ target: srdSubclasses.slug, set: updateOnConflict(srdSubclasses) });
  return classIds;
}

async function importSpecies(tx: Transaction, source: SrdSource) {
  const races = await tx
    .insert(srdSpecies)
    .values(source.races.map(mapRace))
    .onConflictDoUpdate({ target: srdSpecies.slug, set: updateOnConflict(srdSpecies) })
    .returning({ id: srdSpecies.id, slug: srdSpecies.slug });
  const raceIds = idsBySlug(races);

  await tx
    .insert(srdSpecies)
    .values(
      source.subraces.map((subrace) =>
        mapSubrace(subrace, requireId(raceIds, subrace.race.index, subrace.index)),
      ),
    )
    .onConflictDoUpdate({ target: srdSpecies.slug, set: updateOnConflict(srdSpecies) });
}

async function importSpells(tx: Transaction, source: SrdSource, classIds: Map<string, string>) {
  const spells = await tx
    .insert(srdSpells)
    .values(source.spells.map(mapSpell))
    .onConflictDoUpdate({ target: srdSpells.slug, set: updateOnConflict(srdSpells) })
    .returning({ id: srdSpells.id, slug: srdSpells.slug });
  const spellIds = idsBySlug(spells);

  // Les liens sont recréés pour refléter exactement la source.
  await tx.delete(srdSpellClasses).where(inArray(srdSpellClasses.spellId, [...spellIds.values()]));
  await tx.insert(srdSpellClasses).values(
    source.spells.flatMap((spell) =>
      spell.classes.map((srdClass) => ({
        spellId: requireId(spellIds, spell.index, "sort"),
        classId: requireId(classIds, srdClass.index, spell.index),
      })),
    ),
  );
}

async function importStandalone(tx: Transaction, source: SrdSource): Promise<void> {
  await tx
    .insert(srdBackgrounds)
    .values(source.backgrounds.map(mapBackground))
    .onConflictDoUpdate({ target: srdBackgrounds.slug, set: updateOnConflict(srdBackgrounds) });
  await tx
    .insert(srdItems)
    .values([...source.equipment.map(mapEquipment), ...source.magicItems.map(mapMagicItem)])
    .onConflictDoUpdate({ target: srdItems.slug, set: updateOnConflict(srdItems) });
  const monsters = source.monsters.map(mapMonster);
  await tx
    .insert(srdMonsters)
    .values(monsters)
    .onConflictDoUpdate({ target: srdMonsters.slug, set: updateOnConflict(srdMonsters) });
  await tx
    .insert(srdConditions)
    .values(source.conditions.map(mapCondition))
    .onConflictDoUpdate({ target: srdConditions.slug, set: updateOnConflict(srdConditions) });
}

/**
 * Importe le SRD dans une seule transaction : tout ou rien. Rejouable sans doublon (DATA-14) :
 * chaque entrée est insérée ou mise à jour selon son slug, et la version importée est enregistrée.
 * Les entrées absentes de la source ne sont pas supprimées, pour ne pas casser les données qui
 * pourraient y faire référence. Renvoie le bilan de la conversion des attaques de monstres.
 */
export async function importSrd(
  db: SrdDatabase,
  source: SrdSource = loadSrdSource(),
): Promise<SrdImportReport> {
  await db.transaction(async (tx) => {
    const classIds = await importClasses(tx, source);
    await importSpecies(tx, source);
    await importSpells(tx, source, classIds);
    await importStandalone(tx, source);
    await tx
      .insert(srdImports)
      .values(SRD_SOURCE)
      .onConflictDoUpdate({
        target: srdImports.srdVersion,
        set: { ...updateOnConflict(srdImports), importedAt: sql`now()` },
      });
  });
  return { monsterAttacks: reportMonsterAttacks(source.monsters) };
}

/** Version du SRD présente en base, ou `undefined` si aucun import n'a eu lieu. */
export async function getImportedSrdVersion(
  db: SrdDatabase,
): Promise<schema.SrdImport | undefined> {
  const [latest] = await db
    .select()
    .from(srdImports)
    .orderBy(sql`${srdImports.importedAt} desc`)
    .limit(1);
  return latest;
}
