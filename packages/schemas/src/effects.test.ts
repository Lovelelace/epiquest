import { describe, expect, it } from "vitest";
import { actionEffectsSchema } from "./effects.js";
import { invalidActions, validActions } from "./fixtures/effects.js";

describe("actionEffectsSchema", () => {
  it.each(Object.entries(validActions))("accepte l'exemple %s", (_name, action) => {
    expect(actionEffectsSchema.safeParse(action).success).toBe(true);
  });

  it.each(Object.entries(invalidActions))("refuse : %s", (_name, action) => {
    expect(actionEffectsSchema.safeParse(action).success).toBe(false);
  });

  it("applique les valeurs par défaut", () => {
    const parsed = actionEffectsSchema.parse(validActions["goblin-scimitar"]);
    expect(parsed.requiresConcentration).toBe(false);
    expect(parsed.effects[0]).toMatchObject({ type: "attack", onMiss: [] });
  });

  it("couvre chaque type d'effet dans les exemples valides", () => {
    const types = new Set(
      Object.values(validActions).flatMap((action) =>
        actionEffectsSchema
          .parse(action)
          .effects.flatMap((effect) => [
            effect.type,
            ...("onHit" in effect ? effect.onHit.map((e) => e.type) : []),
            ...("onFail" in effect ? effect.onFail.map((e) => e.type) : []),
          ]),
      ),
    );
    expect([...types].sort()).toEqual([
      "apply_condition",
      "attack",
      "damage",
      "healing",
      "modifier",
      "saving_throw",
    ]);
  });
});
