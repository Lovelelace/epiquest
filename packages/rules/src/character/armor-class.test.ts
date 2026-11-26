import { describe, expect, it } from "vitest";
import { type ArmorClassInput, armorClass } from "./armor-class.js";
import { CHAIN_MAIL, LEATHER, SCALE_MAIL } from "./test-helpers.js";

function modifiers(dex: number, con = 0, wis = 0): ArmorClassInput["modifiers"] {
  return { str: 0, dex, con, int: 0, wis, cha: 0 };
}

const base: ArmorClassInput = {
  modifiers: modifiers(0),
  armor: null,
  hasShield: false,
  unarmoredDefense: null,
  bonuses: [],
};

describe("armorClass", () => {
  it("vaut 10 + Dextérité sans armure", () => {
    expect(armorClass({ ...base, modifiers: modifiers(3) })).toBe(13);
  });

  it("ajoute toute la Dextérité en armure légère", () => {
    expect(armorClass({ ...base, modifiers: modifiers(4), armor: LEATHER })).toBe(15);
  });

  it("plafonne la Dextérité à +2 en armure intermédiaire", () => {
    expect(armorClass({ ...base, modifiers: modifiers(4), armor: SCALE_MAIL })).toBe(16);
  });

  it("ignore la Dextérité en armure lourde, même négative", () => {
    expect(armorClass({ ...base, modifiers: modifiers(-1), armor: CHAIN_MAIL })).toBe(16);
    expect(armorClass({ ...base, modifiers: modifiers(3), armor: CHAIN_MAIL })).toBe(16);
  });

  it("ajoute +2 avec un bouclier", () => {
    expect(armorClass({ ...base, armor: CHAIN_MAIL, hasShield: true })).toBe(18);
  });

  it("garde la meilleure formule de base sans les cumuler (barbare)", () => {
    const barbarian = { ability: "con" as const, allowsShield: true };
    expect(
      armorClass({
        ...base,
        modifiers: modifiers(2, 3),
        unarmoredDefense: barbarian,
        hasShield: true,
      }),
    ).toBe(17);
    expect(armorClass({ ...base, modifiers: modifiers(2, -1), unarmoredDefense: barbarian })).toBe(
      12,
    );
  });

  it("n'applique pas la défense sans armure en armure", () => {
    const barbarian = { ability: "con" as const, allowsShield: true };
    expect(
      armorClass({
        ...base,
        modifiers: modifiers(2, 3),
        armor: LEATHER,
        unarmoredDefense: barbarian,
      }),
    ).toBe(13);
  });

  it("perd la défense sans armure du moine avec un bouclier", () => {
    const monk = { ability: "wis" as const, allowsShield: false };
    expect(armorClass({ ...base, modifiers: modifiers(3, 0, 2), unarmoredDefense: monk })).toBe(15);
    expect(
      armorClass({
        ...base,
        modifiers: modifiers(3, 0, 2),
        unarmoredDefense: monk,
        hasShield: true,
      }),
    ).toBe(15);
  });

  it("n'ajoute un bonus « en armure » que si une armure est portée", () => {
    const defense = [{ source: "fighting-style-defense", amount: 1, requiresArmor: true }];
    expect(armorClass({ ...base, bonuses: defense })).toBe(10);
    expect(armorClass({ ...base, armor: CHAIN_MAIL, bonuses: defense })).toBe(17);
  });

  it("cumule les bonus de sources différentes", () => {
    const bonuses = [
      { source: "fighting-style-defense", amount: 1, requiresArmor: true },
      { source: "ring-of-protection", amount: 1, requiresArmor: false },
    ];
    expect(armorClass({ ...base, armor: CHAIN_MAIL, hasShield: true, bonuses })).toBe(20);
  });
});
