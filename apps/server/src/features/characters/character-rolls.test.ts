import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "./test-app.js";
import { createWizard } from "./test-characters.js";

describe("Jets depuis la fiche", () => {
  let testApp: TestApp;
  let characterId: string;
  const http = () => request(testApp.app.getHttpServer());
  const roll = (body: object) => http().post(`/characters/${characterId}/rolls`).send(body);

  beforeAll(async () => {
    // Tous les dés font 11 : le total vaut 11 + modificateur pour un d20.
    testApp = await createTestApp(() => 11);
    characterId = await createWizard(testApp);
  }, 60_000);

  afterAll(async () => {
    await testApp.close();
  });

  it("lance une compétence avec le modificateur de la fiche", async () => {
    const response = await roll({ kind: "skill", key: "arcana" }).expect(201);
    expect(response.body).toMatchObject({
      label: "Arcanes",
      expression: "1d20 + 5",
      dice: [{ sides: 20, value: 11 }],
      total: 16,
      visibility: "public",
    });
  });

  it("lance une sauvegarde et un test de caractéristique", async () => {
    expect((await roll({ kind: "save", key: "int" })).body).toMatchObject({
      label: "Sauvegarde de Intelligence",
      total: 16,
    });
    expect((await roll({ kind: "ability", key: "str" })).body).toMatchObject({
      label: "Test de Force",
      total: 10,
    });
  });

  it("lance l'attaque et les dégâts d'une arme équipée", async () => {
    expect((await roll({ kind: "attack", key: "quarterstaff" })).body).toMatchObject({
      label: "Attaque : Quarterstaff",
      total: 12,
    });
  });

  it("refuse un jet absent de la fiche, sans calculer quoi que ce soit côté client", async () => {
    const response = await roll({ kind: "attack", key: "longbow" });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_ROLL");
    expect((await roll({ kind: "skill", key: "cooking" })).body.code).toBe("INVALID_ROLL");
  });

  it("ne renvoie pas le résultat d'un jet caché au joueur", async () => {
    const response = await roll({ kind: "skill", key: "perception", visibility: "hidden" }).expect(
      201,
    );
    expect(response.body).toMatchObject({
      label: "Perception",
      visibility: "hidden",
      dice: [],
      total: null,
    });
    const recent = await http().get(`/characters/${characterId}/rolls`).expect(200);
    const hidden = recent.body.find((item: { visibility: string }) => item.visibility === "hidden");
    expect(hidden).toMatchObject({ dice: [], total: null });
  });

  it("liste les derniers jets, du plus récent au plus ancien", async () => {
    const recent = await http().get(`/characters/${characterId}/rolls`).expect(200);
    expect(recent.body[0].label).toBe("Perception");
    expect(recent.body.length).toBeGreaterThanOrEqual(5);
  });
});
