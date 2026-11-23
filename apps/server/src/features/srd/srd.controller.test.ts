import { PGlite } from "@electric-sql/pglite";
import { importSrd, migrationsFolder, schema } from "@epiquest/db";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SrdModule } from "./srd.module.js";
import { SRD_DATABASE } from "./srd.service.js";

// Tests d'intégration sur une base PGlite où le SRD complet est importé.
describe("API de consultation du SRD", () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  let app: INestApplication;
  const get = (path: string) => request(app.getHttpServer()).get(path);

  beforeAll(async () => {
    await migrate(db, { migrationsFolder });
    await importSrd(db);
    const moduleRef = await Test.createTestingModule({ imports: [SrdModule] })
      .overrideProvider(SRD_DATABASE)
      .useValue(db)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  it("pagine une liste triée par nom", async () => {
    const response = await get("/srd/spells?pageSize=5&page=2");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 2, pageSize: 5, total: 319 });
    expect(response.body.items).toHaveLength(5);
    const names = response.body.items.map((item: { name: string }) => item.name);
    expect(names).toEqual([...names].sort());
  });

  it("trouve une entrée par le début de son nom", async () => {
    const response = await get("/srd/spells?q=firebal");
    expect(response.body.items[0]).toMatchObject({
      slug: "fireball",
      level: 3,
      school: "evocation",
    });
  });

  it("trouve une entrée par un mot de sa description", async () => {
    const response = await get("/srd/conditions?q=petrified");
    expect(response.body.items.map((item: { slug: string }) => item.slug)).toContain("petrified");
  });

  it("filtre les sorts par niveau, école et classe", async () => {
    const response = await get("/srd/spells?level=3&school=evocation&class=wizard&pageSize=100");
    const slugs = response.body.items.map((item: { slug: string }) => item.slug);
    expect(slugs).toContain("fireball");
    expect(slugs).not.toContain("spirit-guardians");
    for (const item of response.body.items) {
      expect(item).toMatchObject({ level: 3, school: "evocation" });
    }
  });

  it("filtre les monstres par facteur de puissance", async () => {
    const response = await get(
      "/srd/monsters?minChallengeRating=0.25&maxChallengeRating=0.25&type=humanoid",
    );
    const slugs = response.body.items.map((item: { slug: string }) => item.slug);
    expect(slugs).toContain("goblin");
    for (const item of response.body.items) expect(item.challengeRating).toBe(0.25);
  });

  it("filtre les objets par type et rareté", async () => {
    const response = await get("/srd/items?kind=magic_item&rarity=Legendary&pageSize=100");
    expect(response.body.total).toBeGreaterThan(0);
    for (const item of response.body.items) {
      expect(item).toMatchObject({ kind: "magic_item", rarity: "legendary" });
    }
  });

  it("renvoie le détail d'une entrée avec son texte et ses données source", async () => {
    const response = await get("/srd/monsters/goblin");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ slug: "goblin", armorClass: 15, hitPoints: 7 });
    expect(response.body.data.actions).toBeInstanceOf(Array);
  });

  it("renvoie la version du SRD importée", async () => {
    const response = await get("/srd/version");
    expect(response.body).toMatchObject({ srdVersion: "5.1", sourceRef: "v5.12.0" });
  });

  it("répond 404 avec un code stable pour une entrée inconnue", async () => {
    const response = await get("/srd/spells/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ code: "SRD_ENTRY_NOT_FOUND" });
  });

  it("répond 404 pour une entité inconnue", async () => {
    const response = await get("/srd/vehicles");
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ code: "SRD_ENTITY_NOT_FOUND" });
  });

  it("refuse un filtre invalide avec le détail de l'erreur", async () => {
    const response = await get("/srd/spells?level=12");
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: "INVALID_QUERY",
      details: { level: expect.any(Array) },
    });
  });

  it("refuse une taille de page trop grande", async () => {
    expect((await get("/srd/monsters?pageSize=500")).status).toBe(400);
  });
});
