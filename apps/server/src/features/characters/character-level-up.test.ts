import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "./test-app.js";
import { createWizard } from "./test-characters.js";

describe("Montée de niveau", () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());
  const options = (id: string) => http().get(`/characters/${id}/level-up`);
  const levelUp = (id: string, body: object) =>
    http().post(`/characters/${id}/level-up`).send(body);

  beforeAll(async () => {
    // Dé de vie tiré fixé à 2 pour le choix « jet ».
    testApp = await createTestApp(() => 2);
  }, 60_000);

  afterAll(async () => {
    await testApp.close();
  });

  it("mène le magicien de référence au niveau 5 avec les valeurs calculées à la main", async () => {
    const id = await createWizard(testApp);

    const second = await options(id).expect(200);
    expect(second.body).toMatchObject({ nextLevel: 2, hitDie: 6, averageHitPoints: 4 });
    expect(second.body.subclassOptions).toContainEqual({ slug: "evocation", name: "Evocation" });
    await levelUp(id, { hitPointMethod: "average", subclass: "evocation" }).expect(200);

    await levelUp(id, { hitPointMethod: "average" }).expect(200);

    const fourth = await options(id).expect(200);
    expect(fourth.body).toMatchObject({ abilityScoreImprovement: true, newCantrips: 1 });
    await levelUp(id, {
      hitPointMethod: "average",
      abilityScoreImprovement: [{ ability: "int", amount: 2 }],
      cantrips: ["prestidigitation"],
    }).expect(200);

    const fifth = await options(id).expect(200);
    expect(fifth.body.spellList).toContainEqual({ slug: "fireball", name: "Fireball", level: 3 });
    const done = await levelUp(id, {
      hitPointMethod: "average",
      spells: ["magic-missile", "shield", "fireball"],
    }).expect(200);

    expect(done.body.level).toBe(5);
    expect(done.body.statistics).toMatchObject({
      hitPointMaximum: 32,
      armorClass: 12,
      spellcasting: { saveDc: 15, attackBonus: 7 },
    });
    expect(done.body.statistics.spellcasting.slots.slots).toEqual([4, 3, 2]);
    expect(done.body.state).toMatchObject({
      currentHitPoints: 32,
      hitDiceRemaining: 5,
      spellSlotsUsed: [0, 0, 0],
    });

    const history = await http().get(`/characters/${id}/history`);
    expect(history.body[0]).toMatchObject({ type: "level-up" });
    await options(id).expect(422);
    const refused = await levelUp(id, { hitPointMethod: "average" });
    expect(refused.body.code).toBe("LEVEL_MAX_REACHED");
  });

  it("tire le dé de vie côté serveur et garde les PV perdus", async () => {
    const id = await createWizard(testApp);
    await http().post(`/characters/${id}/actions`).send({ type: "damage", amount: 3 });
    const leveled = await levelUp(id, { hitPointMethod: "roll", subclass: "evocation" });
    // Niveau 1 : 6 + 2 (Con) = 8 ; jet 2 + 2 (Con) = 4 de plus ; 5 PV restants + 4.
    expect(leveled.body.statistics.hitPointMaximum).toBe(12);
    expect(leveled.body.state.currentHitPoints).toBe(9);
  });

  it("refuse des choix invalides avec les erreurs du moteur", async () => {
    const id = await createWizard(testApp);
    const missingSubclass = await levelUp(id, { hitPointMethod: "average" });
    expect(missingSubclass.status).toBe(422);
    expect(missingSubclass.body.code).toBe("LEVEL_UP_INVALID");
    expect(missingSubclass.body.details).toContainEqual(
      expect.objectContaining({ code: "SUBCLASS_REQUIRED" }),
    );
    const early = await levelUp(id, {
      hitPointMethod: "average",
      subclass: "evocation",
      abilityScoreImprovement: [{ ability: "int", amount: 2 }],
    });
    expect(early.body.details).toContainEqual(
      expect.objectContaining({ code: "ABILITY_IMPROVEMENT_MISMATCH" }),
    );
    const invalid = await levelUp(id, { hitPointMethod: "max" });
    expect(invalid.status).toBe(400);
  });
});
