import { describe, expect, it } from "vitest";
import { SimpleDiceRoller, type RandomInt } from "./dice-roller.js";

/** Source d'aléatoire fixée : renvoie les valeurs données dans l'ordre. */
function sequence(...values: number[]): RandomInt {
  let index = 0;
  return () => values[index++] ?? 1;
}

describe("SimpleDiceRoller", () => {
  it("additionne les dés et le modificateur", () => {
    const roller = new SimpleDiceRoller(sequence(3, 5));
    expect(roller.roll("2d6+4")).toEqual({ dice: [3, 5], modifier: 4, total: 12 });
  });

  it("accepte un modificateur négatif et un nombre de dés implicite", () => {
    const roller = new SimpleDiceRoller(sequence(2));
    expect(roller.roll("d20 - 1")).toEqual({ dice: [2], modifier: -1, total: 1 });
  });

  it("tire chaque dé entre 1 et son nombre de faces", () => {
    const bounds: Array<[number, number]> = [];
    const roller = new SimpleDiceRoller((min, max) => {
      bounds.push([min, max]);
      return min;
    });
    roller.roll("1d8");
    expect(bounds).toEqual([[1, 9]]);
  });

  it.each(["", "2d7", "0d6", "21d6", "1d6+101", "1d6*2", "attaque"])(
    "refuse la notation « %s »",
    (notation) => {
      expect(new SimpleDiceRoller(sequence()).roll(notation)).toBeNull();
    },
  );

  it("répartit les résultats d'un d6 uniformément sur un grand nombre de tirages", () => {
    const roller = new SimpleDiceRoller();
    const counts = new Map<number, number>();
    const rolls = 6000;
    for (let index = 0; index < rolls; index++) {
      const value = roller.roll("1d6")?.total ?? 0;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    // Attendu : 1000 par face, écart type ≈ 29 ; ±200 laisse une marge de près de 7 écarts types.
    for (const count of counts.values()) expect(Math.abs(count - rolls / 6)).toBeLessThan(200);
  });
});
