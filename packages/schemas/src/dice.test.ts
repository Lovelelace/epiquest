import { describe, expect, it } from "vitest";
import { diceNotationSchema } from "./dice.js";

describe("diceNotationSchema", () => {
  it.each(["1d6", "d20", "2d6 + 3", "4d4+2d4-1", "10", "1D8"])("accepte %s", (notation) => {
    expect(diceNotationSchema.safeParse(notation).success).toBe(true);
  });

  it.each(["", "2d", "d0", "1d6 +", "1d6 * 2", "3 fire", "1d6 + 1d"])(
    "refuse « %s »",
    (notation) => {
      expect(diceNotationSchema.safeParse(notation).success).toBe(false);
    },
  );
});
