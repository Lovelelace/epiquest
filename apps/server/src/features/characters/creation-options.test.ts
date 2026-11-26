import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "./test-app.js";

describe("Options de création et tirage des caractéristiques", () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());

  beforeAll(async () => {
    // Dés fixés : 6, 5, 4, 3, 6, 5, 4, 3… → chaque tirage vaut 6 + 5 + 4 = 15.
    let index = 0;
    const values = [6, 5, 4, 3];
    testApp = await createTestApp(() => values[index++ % values.length] ?? 1);
  }, 60_000);

  afterAll(async () => {
    await testApp.close();
  });

  async function draftWith(choices: object): Promise<string> {
    const { body } = await http().post("/character-drafts");
    await http()
      .patch(`/character-drafts/${body.id as string}`)
      .send({ choices })
      .expect(200);
    return body.id as string;
  }

  it("tire six valeurs 4d6 côté serveur et les garde dans le brouillon", async () => {
    const id = await draftWith({});
    const response = await http().post(`/character-drafts/${id}/ability-rolls`).expect(201);
    expect(response.body.choices.abilityMethod).toBe("rolled");
    expect(response.body.abilityRolls).toHaveLength(6);
    expect(response.body.abilityRolls[0]).toEqual({ dice: [6, 5, 4, 3], total: 15 });
    const reloaded = await http().get(`/character-drafts/${id}`);
    expect(reloaded.body.abilityRolls).toEqual(response.body.abilityRolls);
  });

  it("refuse un second tirage", async () => {
    const id = await draftWith({});
    await http().post(`/character-drafts/${id}/ability-rolls`).expect(201);
    const response = await http().post(`/character-drafts/${id}/ability-rolls`);
    expect(response.status).toBe(409);
    expect(response.body.code).toBe("ABILITIES_ALREADY_ROLLED");
  });

  it("refuse les options tant que l'origine est incomplète", async () => {
    const id = await draftWith({ species: "human" });
    const response = await http().get(`/character-drafts/${id}/options`);
    expect(response.status).toBe(422);
    expect(response.body.code).toBe("ORIGIN_INCOMPLETE");
  });

  it("exige une sous-espèce quand l'espèce en a", async () => {
    const id = await draftWith({ species: "elf", class: "wizard", background: "acolyte" });
    const response = await http().get(`/character-drafts/${id}/options`);
    expect(response.body.code).toBe("SUBSPECIES_REQUIRED");
  });

  it("résout les options d'un magicien haut-elfe acolyte", async () => {
    const id = await draftWith({ species: "high-elf", class: "wizard", background: "acolyte" });
    const { body } = await http().get(`/character-drafts/${id}/options`).expect(200);
    expect(body.originBonuses).toEqual([
      { ability: "dex", amount: 2, source: "species" },
      { ability: "int", amount: 1, source: "species" },
    ]);
    expect(body.grantedSkills).toEqual(["perception", "insight", "religion"]);
    expect(body.skillChoice).toEqual({
      count: 2,
      options: ["arcana", "history", "insight", "investigation", "medicine", "religion"],
    });
    expect(body.subclass).toEqual({
      level: 2,
      options: [{ slug: "evocation", name: "Evocation" }],
    });
    expect(body.spellcasting).toMatchObject({ ability: "int", cantripsKnown: 3, maxSpellLevel: 1 });
    const levels = new Set(
      body.spellcasting.spellList.map((spell: { level: number }) => spell.level),
    );
    expect([...levels].sort()).toEqual([0, 1]);
    expect(body.fixedEquipment).toContainEqual({
      slug: "spellbook",
      name: "Spellbook",
      quantity: 1,
    });
    expect(body.equipmentChoices.length).toBeGreaterThanOrEqual(3);
    const focus = body.equipmentChoices.find((choice: { description: string }) =>
      /focus/.test(choice.description),
    );
    expect(focus.options.length).toBeGreaterThan(2);
  });

  it("ajoute les compétences données par les traits d'espèce", async () => {
    const id = await draftWith({ species: "half-orc", class: "fighter", background: "acolyte" });
    const { body } = await http().get(`/character-drafts/${id}/options`).expect(200);
    expect(body.grantedSkills).toContain("intimidation");
    expect(body.spellcasting).toBeNull();
  });
});
