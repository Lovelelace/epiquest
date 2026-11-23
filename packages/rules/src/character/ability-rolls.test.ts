import { describe, expect, it } from "vitest";
import { rollAbilityScore, rollAbilityScores } from "./ability-rolls.js";

/** Suite de dés fixée pour un résultat exact. */
function sequence(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length] ?? 1;
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) pour le test statistique. */
function seeded(seed: number) {
  let state = seed;
  return (sides: number) => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    const unit = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return 1 + Math.floor(unit * sides);
  };
}

describe("rollAbilityScore", () => {
  it("garde les 3 meilleurs dés sur 4", () => {
    expect(rollAbilityScore(sequence([1, 6, 3, 5]))).toEqual({ dice: [1, 6, 3, 5], total: 14 });
  });

  it("ne retire qu'un seul dé en cas d'égalité", () => {
    expect(rollAbilityScore(sequence([2, 2, 2, 2])).total).toBe(6);
  });

  it("refuse un dé hors de 1 à 6", () => {
    expect(() => rollAbilityScore(sequence([7, 1, 1, 1]))).toThrow(RangeError);
  });

  it("donne six tirages", () => {
    expect(rollAbilityScores(sequence([6, 5, 4, 3]))).toHaveLength(6);
  });

  it("suit la distribution attendue sur 20 000 tirages (moyenne ≈ 12,24)", () => {
    const rollDie = seeded(42);
    const totals = Array.from({ length: 20_000 }, () => rollAbilityScore(rollDie).total);
    const mean = totals.reduce((sum, total) => sum + total, 0) / totals.length;
    expect(mean).toBeGreaterThan(12.15);
    expect(mean).toBeLessThan(12.33);
    expect(Math.min(...totals)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...totals)).toBe(18);
    // P(18) = 21 / 1296 ≈ 1,6 %
    const eighteens = totals.filter((total) => total === 18).length / totals.length;
    expect(eighteens).toBeGreaterThan(0.011);
    expect(eighteens).toBeLessThan(0.021);
  });
});
