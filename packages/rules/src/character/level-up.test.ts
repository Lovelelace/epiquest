import { describe, expect, it } from "vitest";
import { classProgression } from "./class-progression.js";
import { extendUsedSlots, hitPointGain, levelUpGains } from "./level-up.js";

describe("Montée de niveau", () => {
  it("gain de PV : moyenne du dé de vie ou jet injecté", () => {
    expect(hitPointGain("average", 6, () => 1)).toBe(4);
    expect(hitPointGain("average", 10, () => 1)).toBe(6);
    expect(hitPointGain("roll", 8, (sides) => sides - 3)).toBe(5);
  });

  it("magicien : sous-classe au niveau 2, sort mineur au niveau 4 avec l'augmentation", () => {
    const wizard = classProgression("wizard");
    expect(levelUpGains(wizard, 1)).toMatchObject({
      nextLevel: 2,
      choosesSubclass: true,
      abilityScoreImprovement: false,
      newCantrips: 0,
    });
    expect(levelUpGains(wizard, 3)).toMatchObject({
      nextLevel: 4,
      abilityScoreImprovement: true,
      newCantrips: 1,
    });
  });

  it("barde : deux expertises au niveau 3 ; roublard : aucune au niveau 2", () => {
    expect(levelUpGains(classProgression("bard"), 2).expertiseCount).toBe(2);
    expect(levelUpGains(classProgression("rogue"), 1).expertiseCount).toBe(0);
  });

  it("refuse de dépasser le niveau 5", () => {
    expect(() => levelUpGains(classProgression("fighter"), 5)).toThrow(RangeError);
  });

  it("garde les emplacements dépensés et ajoute les nouveaux", () => {
    expect(extendUsedSlots([2, 1], 3)).toEqual([2, 1, 0]);
    expect(extendUsedSlots([], 1)).toEqual([0]);
  });
});
