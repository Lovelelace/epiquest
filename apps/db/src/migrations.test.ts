import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, describe, expect, it } from "vitest";
import { migrationsFolder } from "./paths.js";

// PostgreSQL embarqué (PGlite) : les migrations sont testées sans serveur de base.
describe("migrations", () => {
  const client = new PGlite();
  const db = drizzle(client);

  afterAll(async () => {
    await client.close();
  });

  it("s'appliquent sur une base vide", async () => {
    await migrate(db, { migrationsFolder });
    const result = await client.query<{ count: number }>(
      "select count(*)::int as count from drizzle.__drizzle_migrations",
    );
    expect(result.rows[0]?.count).toBeGreaterThan(0);
  });

  it("peuvent être rejouées sans erreur", async () => {
    await expect(migrate(db, { migrationsFolder })).resolves.not.toThrow();
  });
});
