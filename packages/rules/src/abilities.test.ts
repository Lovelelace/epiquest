import { describe, expect, it } from "vitest";
import { abilityModifier, proficiencyBonus } from "./abilities.js";

describe("abilityModifier", () => {
  it.each([
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [15, 2],
    [20, 5],
    [30, 10],
  ])("valeur %i → modificateur %i", (score, expected) => {
    expect(abilityModifier(score)).toBe(expected);
  });

  it.each([0, 31, 10.5, Number.NaN])("rejette la valeur %s", (score) => {
    expect(() => abilityModifier(score)).toThrow(RangeError);
  });
});

describe("proficiencyBonus", () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [9, 4],
    [13, 5],
    [17, 6],
    [20, 6],
  ])("niveau %i → bonus +%i", (level, expected) => {
    expect(proficiencyBonus(level)).toBe(expected);
  });

  it.each([0, 21, 2.5])("rejette le niveau %s", (level) => {
    expect(() => proficiencyBonus(level)).toThrow(RangeError);
  });
});
