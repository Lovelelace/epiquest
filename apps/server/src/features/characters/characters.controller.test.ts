import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "./test-app.js";

/** Magicien haut-elfe acolyte : le personnage de référence « high-elf-wizard » au niveau 1. */
const WIZARD_CHOICES = {
  name: "Elara",
  species: "high-elf",
  class: "wizard",
  background: "acolyte",
  abilityMethod: "standard-array",
  baseAbilityScores: { str: 8, dex: 13, con: 14, int: 15, wis: 12, cha: 10 },
  chosenSkills: ["arcana", "investigation"],
  cantrips: ["fire-bolt", "light", "mage-hand"],
  spells: ["magic-missile", "shield"],
};

describe("Création d'un personnage depuis l'assistant", () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());

  beforeAll(async () => {
    testApp = await createTestApp();
  }, 60_000);

  afterAll(async () => {
    await testApp.close();
  });

  async function draftWith(choices: object): Promise<string> {
    const { body } = await http().post("/character-drafts");
    const id = body.id as string;
    await http().patch(`/character-drafts/${id}`).send({ choices }).expect(200);
    const options = await http().get(`/character-drafts/${id}/options`);
    if (options.status === 200) {
      const equipment = options.body.equipmentChoices.map(() => 0);
      await http().patch(`/character-drafts/${id}`).send({ choices: { equipment } }).expect(200);
    }
    return id;
  }

  it("donne un aperçu sans erreur avec les statistiques du moteur", async () => {
    const id = await draftWith(WIZARD_CHOICES);
    const { body } = await http().get(`/character-drafts/${id}/preview`).expect(200);
    expect(body.violations).toEqual([]);
    expect(body.statistics).toMatchObject({
      armorClass: 12,
      hitPointMaximum: 8,
      passivePerception: 13,
      spellcasting: { saveDc: 13, attackBonus: 5 },
    });
  });

  it("liste les erreurs restantes dans l'aperçu", async () => {
    const id = await draftWith({ ...WIZARD_CHOICES, name: null, chosenSkills: ["arcana"] });
    const { body } = await http().get(`/character-drafts/${id}/preview`).expect(200);
    expect(body.violations.map((item: { code: string }) => item.code)).toEqual([
      "NAME_REQUIRED",
      "SKILL_COUNT",
    ]);
  });

  it("crée le personnage, supprime le brouillon et calcule la fiche", async () => {
    const id = await draftWith(WIZARD_CHOICES);
    const created = await http().post(`/character-drafts/${id}/character`).expect(201);
    expect(created.body).toMatchObject({
      name: "Elara",
      level: 1,
      species: { slug: "high-elf" },
      class: { slug: "wizard" },
      statistics: { armorClass: 12, hitPointMaximum: 8 },
      state: { currentHitPoints: 8, temporaryHitPoints: 0, hitDiceRemaining: 1, money: { gp: 15 } },
    });
    expect(created.body.cantrips.map((spell: { slug: string }) => spell.slug)).toEqual([
      "fire-bolt",
      "light",
      "mage-hand",
    ]);
    expect(created.body.features.map((feature: { slug: string }) => feature.slug)).toContain(
      "arcane-recovery",
    );
    expect(created.body.state.inventory.map((item: { slug: string }) => item.slug)).toContain(
      "spellbook",
    );
    expect(created.body.attacks.map((attack: { slug: string }) => attack.slug)).toEqual([
      "quarterstaff",
    ]);
    await http().get(`/character-drafts/${id}`).expect(404);
    const reloaded = await http()
      .get(`/characters/${created.body.id as string}`)
      .expect(200);
    expect(reloaded.body.statistics).toEqual(created.body.statistics);
  });

  it("refuse la création si une règle n'est pas respectée", async () => {
    const id = await draftWith({ ...WIZARD_CHOICES, spells: ["fireball"] });
    const response = await http().post(`/character-drafts/${id}/character`);
    expect(response.status).toBe(422);
    expect(response.body.code).toBe("CHARACTER_INVALID");
    expect(response.body.details.map((item: { code: string }) => item.code)).toEqual([
      "SPELL_LEVEL_TOO_HIGH",
    ]);
  });

  it("refuse des valeurs qui ne sont pas celles tirées par le serveur", async () => {
    const id = await draftWith({ ...WIZARD_CHOICES, abilityMethod: null });
    await http().post(`/character-drafts/${id}/ability-rolls`).expect(201);
    await http()
      .patch(`/character-drafts/${id}`)
      .send({
        choices: { baseAbilityScores: { str: 18, dex: 18, con: 18, int: 18, wis: 18, cha: 18 } },
      });
    const response = await http().post(`/character-drafts/${id}/character`);
    expect(response.body.details.map((item: { code: string }) => item.code)).toContain(
      "ROLLED_SCORES_MISMATCH",
    );
  });

  it("calcule la CA d'un guerrier en cotte de mailles avec bouclier", async () => {
    const id = await draftWith({
      name: "Bram",
      species: "human",
      class: "fighter",
      background: "acolyte",
      abilityMethod: "standard-array",
      baseAbilityScores: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      chosenSkills: ["athletics", "perception"],
    });
    const created = await http().post(`/character-drafts/${id}/character`).expect(201);
    // Option 0 du premier choix : cotte de mailles. Option 0 du deuxième : arme martiale et bouclier.
    expect(created.body.statistics.armorClass).toBe(18);
    expect(created.body.statistics.hitPointMaximum).toBe(12);
  });
});
