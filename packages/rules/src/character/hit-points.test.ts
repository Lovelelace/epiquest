import { describe, expect, it } from "vitest";
import { averageHitDieGain, hitPointMaximum } from "./hit-points.js";

describe("averageHitDieGain", () => {
  it.each([
    [6, 4],
    [8, 5],
    [10, 6],
    [12, 7],
  ])("d%i → %i", (die, expected) => {
    expect(averageHitDieGain(die)).toBe(expected);
  });
});

describe("hitPointMaximum", () => {
  const input = { level: 1, hitDie: 10, constitutionModifier: 2, gains: [], bonusPerLevel: 0 };

  it("donne le dé de vie maximal plus la Constitution au niveau 1", () => {
    expect(hitPointMaximum(input)).toBe(12);
  });

  it("ajoute chaque gain et la Constitution à chaque niveau", () => {
    expect(hitPointMaximum({ ...input, level: 3, gains: [6, 4] })).toBe(26);
  });

  it("ajoute le bonus d'espèce à chaque niveau (Robustesse naine)", () => {
    expect(hitPointMaximum({ ...input, level: 2, gains: [6], bonusPerLevel: 1 })).toBe(22);
  });

  it("retire la Constitution négative à chaque niveau", () => {
    expect(
      hitPointMaximum({ ...input, hitDie: 6, constitutionModifier: -1, level: 2, gains: [4] }),
    ).toBe(8);
  });

  it("refuse un nombre de gains qui ne correspond pas au niveau", () => {
    expect(() => hitPointMaximum({ ...input, level: 2 })).toThrow(RangeError);
  });

  it.each([0, 11, 2.5])("refuse un gain de %s", (gain) => {
    expect(() => hitPointMaximum({ ...input, level: 2, gains: [gain] })).toThrow(RangeError);
  });
});
