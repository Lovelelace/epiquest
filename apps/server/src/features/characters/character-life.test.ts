import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "./test-app.js";
import { createWizard } from "./test-characters.js";

describe("Vie du personnage", () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());
  const act = (id: string, body: object) => http().post(`/characters/${id}/actions`).send(body);

  beforeAll(async () => {
    // Dés de vie fixés à 3 (d6) pour le repos court.
    testApp = await createTestApp(() => 3);
  }, 60_000);

  afterAll(async () => {
    await testApp.close();
  });

  it("applique dégâts, PV temporaires et soins avec les règles du moteur", async () => {
    const id = await createWizard(testApp);
    await act(id, { type: "temporary-hit-points", amount: 3 }).expect(200);
    const hurt = await act(id, { type: "damage", amount: 5 }).expect(200);
    expect(hurt.body.state).toMatchObject({ currentHitPoints: 6, temporaryHitPoints: 0 });
    const healed = await act(id, { type: "heal", amount: 10 });
    expect(healed.body.state.currentHitPoints).toBe(8);
  });

  it("repos court : dé de vie + Con, côté serveur ; refuse sans dé de vie", async () => {
    const id = await createWizard(testApp);
    await act(id, { type: "damage", amount: 7 });
    const rested = await act(id, { type: "short-rest", hitDice: 1 }).expect(200);
    expect(rested.body.state).toMatchObject({ currentHitPoints: 6, hitDiceRemaining: 0 });
    const refused = await act(id, { type: "short-rest", hitDice: 1 });
    expect(refused.status).toBe(422);
    expect(refused.body.code).toBe("NO_HIT_DICE_LEFT");
    const long = await act(id, { type: "long-rest" });
    expect(long.body.state).toMatchObject({ currentHitPoints: 8, hitDiceRemaining: 1 });
  });

  it("recalcule le poids porté quand l'inventaire change", async () => {
    const id = await createWizard(testApp);
    const before = await http().get(`/characters/${id}`);
    const added = await act(id, { type: "add-item", slug: "chain-mail", quantity: 1 }).expect(200);
    expect(added.body.statistics.carrying.weight).toBe(before.body.statistics.carrying.weight + 55);
    expect(added.body.statistics.carrying.encumbrance).toBe("encumbered");
    const equipped = await act(id, { type: "equip-item", slug: "chain-mail", isEquipped: true });
    expect(equipped.body.statistics.armorClass).toBe(16);
    const removed = await act(id, { type: "remove-item", slug: "chain-mail", quantity: 1 });
    expect(removed.body.statistics.carrying.weight).toBe(before.body.statistics.carrying.weight);
    expect((await act(id, { type: "add-item", slug: "lightsaber", quantity: 1 })).body.code).toBe(
      "ITEM_NOT_FOUND",
    );
  });

  it("dépense de l'argent en rendant la monnaie, refuse au-delà de la bourse", async () => {
    const id = await createWizard(testApp);
    const spent = await act(id, { type: "money", delta: { sp: -3 } }).expect(200);
    expect(spent.body.state.money).toEqual({ cp: 0, sp: 2, ep: 1, gp: 14, pp: 0 });
    const refused = await act(id, { type: "money", delta: { gp: -100 } });
    expect(refused.body.code).toBe("INSUFFICIENT_FUNDS");
  });

  it("enregistre les notes et historise chaque modification", async () => {
    const id = await createWizard(testApp);
    await act(id, { type: "notes", notes: "Doit 3 po à l'aubergiste." });
    await act(id, { type: "damage", amount: 2 });
    const { body } = await http().get(`/characters/${id}/history`).expect(200);
    expect(body.map((entry: { type: string }) => entry.type)).toEqual([
      "damage",
      "notes",
      "created",
    ]);
    expect(body[0].summary).toBe("2 dégâts subis.");
    expect((await http().get(`/characters/${id}`)).body.state.notes).toBe(
      "Doit 3 po à l'aubergiste.",
    );
  });

  it("refuse une action invalide", async () => {
    const id = await createWizard(testApp);
    const response = await act(id, { type: "damage", amount: -5 });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_INPUT");
  });
});
