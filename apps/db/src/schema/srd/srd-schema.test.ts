import { PGlite } from "@electric-sql/pglite";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrationsFolder } from "../../paths.js";
import * as schema from "../index.js";

const { srdClasses, srdMonsters, srdSpecies, srdSpellClasses, srdSpells } = schema;

const fireball = {
  slug: "fireball",
  name: "Fireball",
  description: "A bright streak flashes from your pointing finger and blossoms into an explosion.",
  raw: { index: "fireball" },
  level: 3,
  school: "evocation",
  castingTime: "1 action",
  range: "150 feet",
  duration: "Instantaneous",
};

// Le schéma SRD est vérifié sur PostgreSQL embarqué (PGlite), migrations appliquées.
describe("schéma des entités du SRD", () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  beforeAll(async () => {
    await migrate(db, { migrationsFolder });
  });

  afterAll(async () => {
    await client.close();
  });

  it("enregistre un sort et le relie à une classe", async () => {
    const [wizard] = await db
      .insert(srdClasses)
      .values({ slug: "wizard", name: "Wizard", raw: {}, hitDie: 6 })
      .returning();
    const [spell] = await db.insert(srdSpells).values(fireball).returning();
    if (!wizard || !spell) throw new Error("insertion attendue");
    await db.insert(srdSpellClasses).values({ spellId: spell.id, classId: wizard.id });

    const links = await db
      .select()
      .from(srdSpellClasses)
      .where(eq(srdSpellClasses.classId, wizard.id));
    expect(links).toEqual([{ spellId: spell.id, classId: wizard.id }]);
  });

  it("refuse deux entrées avec le même slug", async () => {
    await expect(db.insert(srdSpells).values(fireball)).rejects.toThrow();
  });

  it("refuse un sort de niveau supérieur à 9", async () => {
    await expect(
      db.insert(srdSpells).values({ ...fireball, slug: "too-high", level: 10 }),
    ).rejects.toThrow();
  });

  it("refuse un dé de vie qui n'existe pas", async () => {
    await expect(
      db.insert(srdClasses).values({ slug: "odd", name: "Odd", raw: {}, hitDie: 7 }),
    ).rejects.toThrow();
  });

  it("trouve une entrée par recherche plein texte sur le nom ou la description", async () => {
    const byName = await db
      .select({ slug: srdSpells.slug })
      .from(srdSpells)
      .where(sql`${srdSpells.search} @@ plainto_tsquery('english', 'fireball')`);
    const byDescription = await db
      .select({ slug: srdSpells.slug })
      .from(srdSpells)
      .where(sql`${srdSpells.search} @@ plainto_tsquery('english', 'explosions')`);
    expect(byName).toEqual([{ slug: "fireball" }]);
    expect(byDescription).toEqual([{ slug: "fireball" }]);
  });

  it("supprime les sous-espèces avec leur espèce parente", async () => {
    const [dwarf] = await db
      .insert(srdSpecies)
      .values({ slug: "dwarf", name: "Dwarf", raw: {}, size: "medium", speed: 25 })
      .returning();
    if (!dwarf) throw new Error("insertion attendue");
    await db
      .insert(srdSpecies)
      .values({ slug: "hill-dwarf", name: "Hill Dwarf", raw: {}, parentId: dwarf.id });

    await db.delete(srdSpecies).where(eq(srdSpecies.id, dwarf.id));
    expect(await db.select().from(srdSpecies)).toEqual([]);
  });

  it("stocke un facteur de puissance fractionnaire", async () => {
    await db.insert(srdMonsters).values({
      slug: "kobold",
      name: "Kobold",
      raw: {},
      size: "small",
      type: "humanoid",
      challengeRating: 0.125,
      armorClass: 12,
      hitPoints: 5,
    });
    const rows = await db
      .select({ challengeRating: srdMonsters.challengeRating })
      .from(srdMonsters)
      .where(sql`${srdMonsters.challengeRating} < 1`);
    expect(rows).toEqual([{ challengeRating: 0.125 }]);
  });
});
