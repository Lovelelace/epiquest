import { describe, expect, it } from "vitest";
import { deriveStatistics } from "./derive.js";
import { CHAIN_MAIL, makeBuild } from "./test-helpers.js";
import type { ClassData } from "./types.js";

const WIZARD: ClassData = {
  index: "wizard",
  hitDie: 6,
  savingThrows: ["int", "wis"],
  spellcasting: { ability: "int", progression: "full" },
  unarmoredDefense: null,
};

describe("deriveStatistics", () => {
  it("applique les bonus de caractéristique avant les modificateurs", () => {
    const stats = deriveStatistics(
      makeBuild({
        baseAbilityScores: { str: 15, dex: 10, con: 13, int: 10, wis: 10, cha: 10 },
        abilityBonuses: [
          { ability: "str", amount: 1, source: "species" },
          { ability: "con", amount: 1, source: "species" },
        ],
      }),
    );
    expect(stats.abilityScores.str).toBe(16);
    expect(stats.abilityModifiers).toMatchObject({ str: 3, con: 2 });
    expect(stats.hitPointMaximum).toBe(12);
  });

  it("ajoute la maîtrise aux sauvegardes de la classe seulement", () => {
    const stats = deriveStatistics(makeBuild({ level: 5, hitPointGains: [6, 6, 6, 6] }));
    expect(stats.proficiencyBonus).toBe(3);
    expect(stats.savingThrows.str).toEqual({ modifier: 3, proficiency: "proficient" });
    expect(stats.savingThrows.dex).toEqual({ modifier: 0, proficiency: "none" });
  });

  it("double la maîtrise avec l'expertise", () => {
    const stats = deriveStatistics(
      makeBuild({ skillProficiencies: ["stealth", "perception"], skillExpertise: ["stealth"] }),
    );
    expect(stats.skills.stealth).toEqual({ modifier: 4, proficiency: "expertise" });
    expect(stats.skills.perception).toEqual({ modifier: 2, proficiency: "proficient" });
    expect(stats.passivePerception).toBe(12);
  });

  it("calcule le DD et l'attaque des sorts d'un lanceur", () => {
    const stats = deriveStatistics(
      makeBuild({
        classData: WIZARD,
        baseAbilityScores: { str: 8, dex: 14, con: 13, int: 16, wis: 12, cha: 10 },
      }),
    );
    expect(stats.spellcasting).toEqual({
      ability: "int",
      saveDc: 13,
      attackBonus: 5,
      slots: { slots: [2], pact: null },
    });
  });

  it("n'a pas de statistiques de sorts sans incantation", () => {
    expect(deriveStatistics(makeBuild()).spellcasting).toBeNull();
  });

  it("signale le désavantage en Discrétion et la vitesse réduite de l'armure lourde", () => {
    const stats = deriveStatistics(makeBuild({ armor: CHAIN_MAIL, carriedWeight: 55 }));
    expect(stats.hasStealthDisadvantage).toBe(true);
    expect(stats.carrying.encumbrance).toBe("encumbered");
    expect(stats.speed).toBe(10);
  });

  it("utilise la Dextérité pour l'initiative", () => {
    const stats = deriveStatistics(
      makeBuild({ baseAbilityScores: { str: 10, dex: 17, con: 10, int: 10, wis: 10, cha: 10 } }),
    );
    expect(stats.initiative).toBe(3);
    expect(stats.hitDice).toEqual({ die: 10, count: 1 });
  });
});
