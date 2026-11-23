import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "./health.js";

describe("healthResponseSchema", () => {
  it("accepte une réponse valide", () => {
    expect(healthResponseSchema.parse({ status: "ok" })).toEqual({ status: "ok" });
  });

  it("refuse un statut inconnu", () => {
    expect(healthResponseSchema.safeParse({ status: "ko" }).success).toBe(false);
  });
});
