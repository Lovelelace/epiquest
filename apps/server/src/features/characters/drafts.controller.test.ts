import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mergeChoices } from "./drafts.service.js";
import { createTestApp, type TestApp } from "./test-app.js";
import { EMPTY_DRAFT_CHOICES } from "@epiquest/schemas";

describe("API des brouillons de personnage", () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());

  beforeAll(async () => {
    testApp = await createTestApp();
  }, 60_000);

  afterAll(async () => {
    await testApp.close();
  });

  async function createDraft(): Promise<string> {
    const response = await http().post("/character-drafts");
    expect(response.status).toBe(201);
    return response.body.id as string;
  }

  it("crée un brouillon vide à la première étape", async () => {
    const response = await http().post("/character-drafts");
    expect(response.body).toMatchObject({
      step: "species",
      choices: EMPTY_DRAFT_CHOICES,
      abilityRolls: null,
    });
  });

  it("enregistre les choix et l'étape, puis les relit", async () => {
    const id = await createDraft();
    await http()
      .patch(`/character-drafts/${id}`)
      .send({ step: "background", choices: { species: "high-elf", class: "wizard" } })
      .expect(200);
    const response = await http().get(`/character-drafts/${id}`).expect(200);
    expect(response.body).toMatchObject({
      step: "background",
      choices: { species: "high-elf", class: "wizard", background: null },
    });
  });

  it("efface les choix de classe quand la classe change", async () => {
    const id = await createDraft();
    await http()
      .patch(`/character-drafts/${id}`)
      .send({ choices: { class: "wizard", cantrips: ["light"], chosenSkills: ["arcana"] } });
    const response = await http()
      .patch(`/character-drafts/${id}`)
      .send({ choices: { class: "fighter" } });
    expect(response.body.choices).toMatchObject({
      class: "fighter",
      cantrips: [],
      chosenSkills: [],
    });
  });

  it("refuse une entrée du SRD qui n'existe pas", async () => {
    const id = await createDraft();
    const response = await http()
      .patch(`/character-drafts/${id}`)
      .send({ choices: { class: "jedi" } });
    expect(response.status).toBe(404);
    expect(response.body.code).toBe("SRD_ENTRY_NOT_FOUND");
  });

  it("refuse un brouillon invalide avec le détail", async () => {
    const id = await createDraft();
    const response = await http().patch(`/character-drafts/${id}`).send({ step: "nowhere" });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: "INVALID_INPUT",
      details: { step: expect.any(Array) },
    });
  });

  it("renvoie 404 pour un brouillon inconnu", async () => {
    const response = await http().get("/character-drafts/00000000-0000-4000-8000-000000000000");
    expect(response.status).toBe(404);
    expect(response.body.code).toBe("DRAFT_NOT_FOUND");
  });
});

describe("mergeChoices", () => {
  it("garde les choix dépendants si le choix parent ne change pas", () => {
    const current = { ...EMPTY_DRAFT_CHOICES, class: "wizard", cantrips: ["light"] };
    expect(mergeChoices(current, { class: "wizard" }).cantrips).toEqual(["light"]);
  });

  it("efface les valeurs de base quand la méthode change", () => {
    const current = {
      ...EMPTY_DRAFT_CHOICES,
      abilityMethod: "standard-array" as const,
      baseAbilityScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    };
    expect(mergeChoices(current, { abilityMethod: "point-buy" }).baseAbilityScores).toBeNull();
  });
});
