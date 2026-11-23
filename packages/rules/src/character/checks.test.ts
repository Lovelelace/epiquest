import { describe, expect, it } from "vitest";
import { rollCheck, rollDamage } from "./checks.js";

const fixed = (...values: number[]) => {
  let index = 0;
  return () => values[index++] ?? 1;
};

describe("rollCheck", () => {
  it("ajoute le modificateur au d20", () => {
    expect(rollCheck(fixed(14), 3)).toEqual({
      expression: "1d20 + 3",
      dice: [{ sides: 20, value: 14 }],
      modifier: 3,
      total: 17,
    });
  });

  it("écrit un modificateur négatif et omet un modificateur nul", () => {
    expect(rollCheck(fixed(5), -1).expression).toBe("1d20 - 1");
    expect(rollCheck(fixed(5), 0).expression).toBe("1d20");
  });

  it("refuse un dé hors de 1 à 20", () => {
    expect(() => rollCheck(fixed(21), 0)).toThrow(RangeError);
  });
});

describe("rollDamage", () => {
  it("lance les dés de l'arme et ajoute le modificateur", () => {
    expect(rollDamage(fixed(3, 5), "2d6", 2)).toMatchObject({ expression: "2d6 + 2", total: 10 });
  });

  it("ne descend pas sous 0 dégât", () => {
    expect(rollDamage(fixed(1), "1d4", -3).total).toBe(0);
  });

  it("refuse une notation non prise en charge", () => {
    expect(() => rollDamage(fixed(1), "2d6+1d4", 0)).toThrow(RangeError);
  });
});
