import { describe, expect, it } from "vitest";
import {
  addItem,
  applyDamage,
  changeMoney,
  equipItem,
  grantTemporaryHitPoints,
  heal,
  LifeRuleError,
  longRest,
  removeItem,
  shortRest,
} from "./life.js";

const coins = (values: Partial<Record<"cp" | "sp" | "ep" | "gp" | "pp", number>>) => ({
  cp: 0,
  sp: 0,
  ep: 0,
  gp: 0,
  pp: 0,
  ...values,
});

describe("points de vie", () => {
  it("retire d'abord les PV temporaires", () => {
    expect(applyDamage({ current: 10, temporary: 4 }, 6)).toEqual({ current: 8, temporary: 0 });
    expect(applyDamage({ current: 10, temporary: 4 }, 3)).toEqual({ current: 10, temporary: 1 });
  });

  it("ne descend pas sous 0 PV", () => {
    expect(applyDamage({ current: 5, temporary: 0 }, 12)).toEqual({ current: 0, temporary: 0 });
  });

  it("ne soigne pas au-delà du maximum ni les PV temporaires", () => {
    expect(heal({ current: 5, temporary: 2 }, 10, 12)).toEqual({ current: 12, temporary: 2 });
  });

  it("garde la plus haute valeur de PV temporaires sans les cumuler", () => {
    expect(grantTemporaryHitPoints({ current: 5, temporary: 6 }, 4).temporary).toBe(6);
    expect(grantTemporaryHitPoints({ current: 5, temporary: 2 }, 4).temporary).toBe(4);
  });
});

describe("repos", () => {
  const state = {
    hitPoints: { current: 3, temporary: 2 },
    hitDiceRemaining: 3,
    spellSlotsUsed: [2, 1],
    pactSlotsUsed: 1,
  };

  it("repos court : chaque dé de vie rend dé + Con et récupère la magie de pacte", () => {
    const values = [4, 1];
    const result = shortRest({
      state,
      hitDiceToSpend: 2,
      hitDie: 8,
      constitutionModifier: -2,
      maximum: 20,
      rollDie: () => values.shift() ?? 1,
    });
    expect(result.rolls).toEqual([
      { value: 4, healed: 2 },
      { value: 1, healed: 0 },
    ]);
    expect(result.state).toEqual({
      ...state,
      hitPoints: { current: 5, temporary: 2 },
      hitDiceRemaining: 1,
      pactSlotsUsed: 0,
    });
  });

  it("repos court : refuse de dépenser plus de dés de vie qu'il n'en reste", () => {
    expect(() =>
      shortRest({
        state,
        hitDiceToSpend: 4,
        hitDie: 8,
        constitutionModifier: 0,
        maximum: 20,
        rollDie: () => 1,
      }),
    ).toThrow(LifeRuleError);
  });

  it("repos long : tous les PV et emplacements, la moitié des dés de vie (au moins 1)", () => {
    expect(longRest({ ...state, hitDiceRemaining: 0 }, 20, 5)).toEqual({
      hitPoints: { current: 20, temporary: 0 },
      hitDiceRemaining: 2,
      spellSlotsUsed: [0, 0],
      pactSlotsUsed: 0,
    });
    expect(longRest({ ...state, hitDiceRemaining: 0 }, 8, 1).hitDiceRemaining).toBe(1);
    expect(longRest({ ...state, hitDiceRemaining: 4 }, 20, 5).hitDiceRemaining).toBe(5);
  });
});

describe("argent", () => {
  it("ajoute des pièces", () => {
    expect(changeMoney(coins({ gp: 15 }), { gp: 5, sp: 3 })).toEqual(coins({ gp: 20, sp: 3 }));
  });

  it("rend la monnaie avec la plus petite pièce supérieure", () => {
    expect(changeMoney(coins({ gp: 1 }), { sp: -3 })).toEqual(coins({ ep: 1, sp: 2 }));
    expect(changeMoney(coins({ pp: 1 }), { cp: -1 })).toEqual(
      coins({ gp: 9, ep: 1, sp: 4, cp: 9 }),
    );
  });

  it("refuse une dépense supérieure à la bourse", () => {
    expect(() => changeMoney(coins({ gp: 1 }), { gp: -2 })).toThrow(LifeRuleError);
  });
});

describe("inventaire", () => {
  const dagger = { slug: "dagger", name: "Dagger", quantity: 1, weight: 1 };

  it("ajoute un objet ou augmente sa quantité", () => {
    const once = addItem([], dagger);
    expect(once).toEqual([{ ...dagger, isEquipped: false }]);
    expect(addItem(once, dagger)[0]?.quantity).toBe(2);
  });

  it("retire une quantité ou l'objet entier", () => {
    const inventory = addItem([], { ...dagger, quantity: 3 });
    expect(removeItem(inventory, "dagger", 1)[0]?.quantity).toBe(2);
    expect(removeItem(inventory, "dagger", 5)).toEqual([]);
    expect(() => removeItem(inventory, "rope", 1)).toThrow(LifeRuleError);
  });

  it("équipe et déséquipe un objet de l'inventaire", () => {
    expect(equipItem(addItem([], dagger), "dagger", true)[0]?.isEquipped).toBe(true);
    expect(() => equipItem([], "dagger", true)).toThrow(LifeRuleError);
  });
});
