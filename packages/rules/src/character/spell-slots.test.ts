import { describe, expect, it } from "vitest";
import { highestSpellLevel, spellSlots } from "./spell-slots.js";

describe("spellSlots", () => {
  it("ne donne aucun emplacement à une classe sans sorts", () => {
    expect(spellSlots(null, 5)).toEqual({ slots: [], pact: null });
  });

  it.each([
    [1, [2]],
    [3, [4, 2]],
    [5, [4, 3, 2]],
    [20, [4, 3, 3, 3, 3, 2, 2, 1, 1]],
  ])("lanceur complet niveau %i → %j", (level, expected) => {
    expect(spellSlots("full", level).slots).toEqual(expected);
  });

  it.each([
    [1, []],
    [2, [2]],
    [3, [3]],
    [5, [4, 2]],
    [20, [4, 3, 3, 3, 2]],
  ])("demi-lanceur niveau %i → %j", (level, expected) => {
    expect(spellSlots("half", level).slots).toEqual(expected);
  });

  it.each([
    [1, 1, 1],
    [2, 2, 1],
    [5, 2, 3],
    [11, 3, 5],
    [17, 4, 5],
  ])("magie de pacte niveau %i → %i emplacements de niveau %i", (level, count, slotLevel) => {
    expect(spellSlots("pact", level)).toEqual({ slots: [], pact: { count, slotLevel } });
  });

  it.each([0, 21, 1.5])("refuse le niveau %s", (level) => {
    expect(() => spellSlots("full", level)).toThrow(RangeError);
  });
});

describe("highestSpellLevel", () => {
  it("prend le niveau le plus élevé, pacte compris", () => {
    expect(highestSpellLevel(spellSlots("full", 5))).toBe(3);
    expect(highestSpellLevel(spellSlots("pact", 5))).toBe(3);
    expect(highestSpellLevel(spellSlots(null, 5))).toBe(0);
  });
});
