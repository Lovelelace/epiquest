import { describe, expect, it } from "vitest";
import { carryingStatus } from "./carrying.js";
import { speed } from "./speed.js";
import { CHAIN_MAIL } from "./test-helpers.js";

describe("carryingStatus", () => {
  it.each([
    [50, "none"],
    [51, "encumbered"],
    [100, "encumbered"],
    [101, "heavily-encumbered"],
    [150, "heavily-encumbered"],
    [151, "overloaded"],
  ] as const)("Force 10 et %i livres → %s", (weight, expected) => {
    expect(carryingStatus(10, weight)).toEqual({ weight, capacity: 150, encumbrance: expected });
  });

  it("refuse un poids négatif", () => {
    expect(() => carryingStatus(10, -1)).toThrow(RangeError);
  });
});

describe("speed", () => {
  const input = { baseSpeed: 30, strength: 15, armor: null, encumbrance: "none" as const };

  it("garde la vitesse de l'espèce par défaut", () => {
    expect(speed(input)).toBe(30);
  });

  it("retire 10 pieds en armure lourde sans la Force requise", () => {
    expect(speed({ ...input, armor: CHAIN_MAIL, strength: 12 })).toBe(20);
    expect(speed({ ...input, armor: CHAIN_MAIL, strength: 13 })).toBe(30);
  });

  it("cumule armure lourde et encombrement", () => {
    expect(speed({ ...input, armor: CHAIN_MAIL, strength: 12, encumbrance: "encumbered" })).toBe(
      10,
    );
    expect(speed({ ...input, encumbrance: "heavily-encumbered" })).toBe(10);
  });

  it("tombe à 5 pieds au-delà de la capacité de charge", () => {
    expect(speed({ ...input, encumbrance: "overloaded" })).toBe(5);
  });

  it("ne descend pas sous 0", () => {
    expect(
      speed({
        ...input,
        baseSpeed: 25,
        armor: CHAIN_MAIL,
        strength: 8,
        encumbrance: "heavily-encumbered",
      }),
    ).toBe(0);
  });
});
