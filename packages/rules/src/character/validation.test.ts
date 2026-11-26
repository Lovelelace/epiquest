import { describe, expect, it } from "vitest";
import {
  type CharacterChoices,
  type CreationRules,
  pointBuyCost,
  validateCharacterChoices,
} from "./validation.js";

/** Magicien haut-elfe de niveau 1, valide. */
const rules: CreationRules = {
  skillChoice: {
    count: 2,
    options: ["arcana", "history", "insight", "investigation", "medicine", "religion"],
  },
  grantedSkills: ["perception", "insight", "religion"],
  subclass: { level: 2, options: ["evocation"] },
  abilityScoreImprovementLevels: [4, 8, 12, 16, 19],
  originBonuses: [
    { ability: "dex", amount: 2, source: "species" },
    { ability: "int", amount: 1, source: "species" },
  ],
  spellcasting: {
    progression: "full",
    cantripsKnown: 3,
    maxSpells: 6,
    spellList: [
      { index: "fire-bolt", level: 0 },
      { index: "light", level: 0 },
      { index: "mage-hand", level: 0 },
      { index: "prestidigitation", level: 0 },
      { index: "magic-missile", level: 1 },
      { index: "shield", level: 1 },
      { index: "misty-step", level: 2 },
      { index: "fireball", level: 3 },
    ],
  },
  rolledScores: null,
};

const valid: CharacterChoices = {
  level: 1,
  abilityMethod: "standard-array",
  baseAbilityScores: { str: 8, dex: 13, con: 14, int: 15, wis: 12, cha: 10 },
  abilityBonuses: rules.originBonuses,
  chosenSkills: ["arcana", "investigation"],
  subclass: null,
  cantrips: ["fire-bolt", "light", "mage-hand"],
  spells: ["magic-missile", "shield"],
};

function codes(
  choices: Partial<CharacterChoices>,
  overrides: Partial<CreationRules> = {},
): string[] {
  return validateCharacterChoices({ ...valid, ...choices }, { ...rules, ...overrides }).map(
    (error) => error.code,
  );
}

describe("validateCharacterChoices", () => {
  it("ne renvoie aucune erreur pour des choix valides", () => {
    expect(validateCharacterChoices(valid, rules)).toEqual([]);
  });

  it("renvoie des messages en français avec le champ concerné", () => {
    const [error] = validateCharacterChoices({ ...valid, chosenSkills: ["arcana"] }, rules);
    expect(error).toEqual({
      code: "SKILL_COUNT",
      message: "Choisissez exactement 2 compétences de classe (1 choisies).",
      path: "chosenSkills",
    });
  });

  describe("niveau", () => {
    it.each([0, 21, 1.5])("refuse le niveau %s", (level) => {
      expect(codes({ level })).toEqual(["LEVEL_OUT_OF_RANGE"]);
    });
  });

  describe("caractéristiques", () => {
    it("accepte un achat de points dans le budget", () => {
      const baseAbilityScores = { str: 8, dex: 14, con: 14, int: 15, wis: 12, cha: 8 };
      expect(codes({ abilityMethod: "point-buy", baseAbilityScores })).toEqual([]);
    });

    it("refuse un achat de points au-delà de 27 points", () => {
      const baseAbilityScores = { str: 15, dex: 15, con: 15, int: 15, wis: 8, cha: 8 };
      expect(codes({ abilityMethod: "point-buy", baseAbilityScores })).toEqual([
        "POINT_BUY_OVER_BUDGET",
      ]);
    });

    it("refuse une valeur hors de 8 à 15 à l'achat de points", () => {
      const baseAbilityScores = { ...valid.baseAbilityScores, str: 7 };
      expect(codes({ abilityMethod: "point-buy", baseAbilityScores })).toEqual([
        "ABILITY_OUT_OF_RANGE",
      ]);
    });

    it("refuse un tableau standard modifié", () => {
      const baseAbilityScores = { ...valid.baseAbilityScores, int: 16 };
      expect(codes({ baseAbilityScores })).toEqual(["STANDARD_ARRAY_MISMATCH"]);
    });

    it("accepte les valeurs tirées par le serveur, dans n'importe quel ordre", () => {
      const rolledScores = [10, 12, 15, 14, 13, 8];
      expect(codes({ abilityMethod: "rolled" }, { rolledScores })).toEqual([]);
    });

    it("refuse des valeurs qui ne sont pas celles tirées", () => {
      expect(
        codes({ abilityMethod: "rolled" }, { rolledScores: [18, 18, 18, 18, 18, 18] }),
      ).toEqual(["ROLLED_SCORES_MISMATCH"]);
      expect(codes({ abilityMethod: "rolled" })).toEqual(["ROLLED_SCORES_MISMATCH"]);
    });

    it("refuse des bonus d'espèce différents de ceux de l'espèce", () => {
      const abilityBonuses = [{ ability: "int" as const, amount: 2, source: "species" as const }];
      expect(codes({ abilityBonuses })).toEqual(["ORIGIN_BONUSES_MISMATCH"]);
    });

    it("exige les points d'augmentation gagnés au niveau 4", () => {
      expect(codes({ level: 4, subclass: "evocation" })).toEqual(["ABILITY_IMPROVEMENT_MISMATCH"]);
      const abilityBonuses = [
        ...rules.originBonuses,
        { ability: "int" as const, amount: 1, source: "ability-score-improvement" as const },
        { ability: "con" as const, amount: 1, source: "ability-score-improvement" as const },
      ];
      expect(codes({ level: 4, subclass: "evocation", abilityBonuses })).toEqual([]);
    });

    it("refuse une augmentation avant le niveau 4", () => {
      const abilityBonuses = [
        ...rules.originBonuses,
        { ability: "int" as const, amount: 2, source: "ability-score-improvement" as const },
      ];
      expect(codes({ abilityBonuses })).toEqual(["ABILITY_IMPROVEMENT_MISMATCH"]);
    });

    it("refuse une caractéristique finale au-delà de 20", () => {
      const improvement = {
        ability: "int" as const,
        amount: 2,
        source: "ability-score-improvement" as const,
      };
      const abilityBonuses = [...rules.originBonuses, improvement, improvement, improvement];
      expect(codes({ level: 12, subclass: "evocation", abilityBonuses })).toEqual([
        "ABILITY_ABOVE_MAXIMUM",
      ]);
    });
  });

  describe("compétences", () => {
    it("refuse une compétence hors de la liste de la classe", () => {
      expect(codes({ chosenSkills: ["arcana", "stealth"] })).toEqual(["SKILL_NOT_ALLOWED"]);
    });

    it("refuse une compétence déjà donnée par l'historique", () => {
      expect(codes({ chosenSkills: ["arcana", "insight"] })).toEqual(["SKILL_DUPLICATE"]);
    });

    it("refuse une compétence choisie deux fois", () => {
      expect(codes({ chosenSkills: ["arcana", "arcana"] })).toEqual(["SKILL_DUPLICATE"]);
    });
  });

  describe("sous-classe", () => {
    it("refuse une sous-classe avant le niveau prévu", () => {
      expect(codes({ subclass: "evocation" })).toEqual(["SUBCLASS_TOO_EARLY"]);
    });

    it("exige une sous-classe à partir du niveau prévu", () => {
      expect(codes({ level: 2 })).toEqual(["SUBCLASS_REQUIRED"]);
    });

    it("refuse une sous-classe d'une autre classe", () => {
      expect(codes({ level: 2, subclass: "champion" })).toEqual(["SUBCLASS_NOT_ALLOWED"]);
    });
  });

  describe("sorts", () => {
    it("exige le nombre exact de sorts mineurs", () => {
      expect(codes({ cantrips: ["fire-bolt"] })).toEqual(["CANTRIP_COUNT"]);
    });

    it("refuse plus de sorts que le maximum", () => {
      const spells = ["magic-missile", "shield", "a", "b", "c", "d", "e"];
      expect(codes({ spells })).toContain("SPELL_COUNT");
    });

    it("refuse un sort hors de la liste de la classe", () => {
      expect(codes({ spells: ["cure-wounds"] })).toEqual(["SPELL_NOT_ALLOWED"]);
    });

    it("refuse un sort mineur parmi les sorts, et l'inverse", () => {
      expect(codes({ spells: ["light"] })).toEqual(["SPELL_NOT_ALLOWED"]);
      expect(codes({ cantrips: ["fire-bolt", "light", "shield"] })).toEqual(["SPELL_NOT_ALLOWED"]);
    });

    it("refuse un sort d'un niveau sans emplacement", () => {
      expect(codes({ spells: ["misty-step"] })).toEqual(["SPELL_LEVEL_TOO_HIGH"]);
      expect(codes({ level: 3, subclass: "evocation", spells: ["misty-step"] })).toEqual([]);
    });

    it("refuse un sort choisi deux fois", () => {
      expect(codes({ spells: ["shield", "shield"] })).toEqual(["SPELL_DUPLICATE"]);
    });

    it("refuse des sorts pour une classe qui n'en lance pas", () => {
      expect(codes({}, { spellcasting: null })).toEqual(["NOT_A_SPELLCASTER"]);
      expect(codes({ cantrips: [], spells: [] }, { spellcasting: null })).toEqual([]);
    });
  });
});

describe("pointBuyCost", () => {
  it("additionne le coût de chaque valeur", () => {
    expect(pointBuyCost({ str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 })).toBe(27);
  });

  it("renvoie null pour une valeur hors de la table", () => {
    expect(pointBuyCost({ str: 16, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })).toBeNull();
  });
});
