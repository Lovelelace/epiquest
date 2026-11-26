import { describe, expect, it } from "vitest";
import { joinParagraphs, mapMonster, toSize } from "./mappers.js";

describe("joinParagraphs", () => {
  it("sépare les paragraphes par une ligne vide", () => {
    expect(joinParagraphs(["Un.", "Deux."])).toBe("Un.\n\nDeux.");
  });

  it("renvoie une chaîne vide sans description", () => {
    expect(joinParagraphs(undefined)).toBe("");
  });
});

describe("toSize", () => {
  it("convertit la taille de la source vers l'enum de la base", () => {
    expect(toSize("Gargantuan")).toBe("gargantuan");
  });

  it("refuse une taille inconnue", () => {
    expect(() => toSize("Colossal")).toThrow(/Colossal/);
  });
});

describe("mapMonster", () => {
  it("garde la première classe d'armure et un facteur de puissance fractionnaire", () => {
    const kobold = {
      index: "kobold",
      name: "Kobold",
      size: "Small",
      type: "humanoid",
      challenge_rating: 0.125,
      armor_class: [{ value: 12 }, { value: 14 }],
      hit_points: 5,
    };
    expect(mapMonster(kobold)).toMatchObject({
      slug: "kobold",
      size: "small",
      challengeRating: 0.125,
      armorClass: 12,
      hitPoints: 5,
      raw: kobold,
    });
  });
});
