import request from "supertest";
import type { TestApp } from "./test-app.js";

/** Magicien haut-elfe acolyte : le personnage de référence « high-elf-wizard » au niveau 1. */
export const WIZARD_CHOICES = {
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

/** Crée un brouillon avec ces choix et la première option de chaque équipement. */
export async function draftWith(testApp: TestApp, choices: object): Promise<string> {
  const http = () => request(testApp.app.getHttpServer());
  const { body } = await http().post("/character-drafts");
  const id = body.id as string;
  await http().patch(`/character-drafts/${id}`).send({ choices });
  const options = await http().get(`/character-drafts/${id}/options`);
  if (options.status === 200) {
    const equipment = (options.body.equipmentChoices as unknown[]).map(() => 0);
    await http().patch(`/character-drafts/${id}`).send({ choices: { equipment } });
  }
  return id;
}

/** Crée directement le personnage de référence et renvoie son identifiant. */
export async function createWizard(testApp: TestApp, overrides: object = {}): Promise<string> {
  const draftId = await draftWith(testApp, { ...WIZARD_CHOICES, ...overrides });
  const response = await request(testApp.app.getHttpServer()).post(
    `/character-drafts/${draftId}/character`,
  );
  return response.body.id as string;
}
