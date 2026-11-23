import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrationsFolder } from "../paths.js";
import * as schema from "../schema/index.js";
import { getImportedSrdVersion, importSrd } from "./import.js";
import { loadSrdSource } from "./source.js";
import { SRD_SOURCE } from "./version.js";

const entityTables = {
  species: schema.srdSpecies,
  classes: schema.srdClasses,
  subclasses: schema.srdSubclasses,
  backgrounds: schema.srdBackgrounds,
  spells: schema.srdSpells,
  spellClasses: schema.srdSpellClasses,
  items: schema.srdItems,
  monsters: schema.srdMonsters,
  conditions: schema.srdConditions,
};

// Import complet du SRD sur PostgreSQL embarqué (PGlite).
describe("importSrd", () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  const source = loadSrdSource();

  async function dumpEntities(): Promise<Record<string, string[]>> {
    const dump: Record<string, string[]> = {};
    for (const [name, table] of Object.entries(entityTables)) {
      // Trié : l'ordre physique des lignes change après une mise à jour.
      const rows = await db.select().from(table);
      dump[name] = rows.map((row) => JSON.stringify(row)).sort();
    }
    return dump;
  }

  beforeAll(async () => {
    await migrate(db, { migrationsFolder });
    await importSrd(db, source);
  }, 60_000);

  afterAll(async () => {
    await client.close();
  });

  it("importe chaque entrée de la source", async () => {
    const dump = await dumpEntities();
    expect(dump.species).toHaveLength(source.races.length + source.subraces.length);
    expect(dump.classes).toHaveLength(source.classes.length);
    expect(dump.spells).toHaveLength(source.spells.length);
    expect(dump.items).toHaveLength(source.equipment.length + source.magicItems.length);
    expect(dump.monsters).toHaveLength(source.monsters.length);
    expect(dump.conditions).toHaveLength(source.conditions.length);
  });

  it("relie les sorts à leurs classes", async () => {
    const [fireball] = await db
      .select()
      .from(schema.srdSpells)
      .where(eq(schema.srdSpells.slug, "fireball"));
    if (!fireball) throw new Error("Fireball attendu");
    const classes = await db
      .select({ slug: schema.srdClasses.slug })
      .from(schema.srdSpellClasses)
      .innerJoin(schema.srdClasses, eq(schema.srdSpellClasses.classId, schema.srdClasses.id))
      .where(eq(schema.srdSpellClasses.spellId, fireball.id));
    expect(fireball).toMatchObject({ level: 3, school: "evocation" });
    expect(classes.map((row) => row.slug).sort()).toEqual(["sorcerer", "wizard"]);
  });

  it("donne la même base quand on le relance", async () => {
    const before = await dumpEntities();
    await importSrd(db, source);
    expect(await dumpEntities()).toEqual(before);
  }, 60_000);

  it("enregistre la version importée", async () => {
    expect(await getImportedSrdVersion(db)).toMatchObject(SRD_SOURCE);
    expect(await db.select().from(schema.srdImports)).toHaveLength(1);
  });
});
