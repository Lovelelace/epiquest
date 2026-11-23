import { deriveStatistics, type CharacterBuild } from "@epiquest/rules";
import { describe, expect, it } from "vitest";
import {
  characterActionSchema,
  characterDraftUpdateSchema,
  derivedStatisticsSchema,
  draftChoicesSchema,
  EMPTY_DRAFT_CHOICES,
  levelUpRequestSchema,
} from "./characters.js";

const build: CharacterBuild = {
  level: 1,
  classData: {
    index: "wizard",
    hitDie: 6,
    savingThrows: ["int", "wis"],
    spellcasting: { ability: "int", progression: "full" },
    unarmoredDefense: null,
  },
  species: { index: "high-elf", speed: 30, hitPointBonusPerLevel: 0 },
  baseAbilityScores: { str: 8, dex: 13, con: 14, int: 15, wis: 12, cha: 10 },
  abilityBonuses: [],
  skillProficiencies: ["arcana"],
  skillExpertise: [],
  hitPointGains: [],
  armor: null,
  hasShield: false,
  armorClassBonuses: [],
  carriedWeight: 10,
};

describe("contrats du personnage", () => {
  it("décrit exactement la sortie du moteur de règles", () => {
    const statistics = deriveStatistics(build);
    expect(derivedStatisticsSchema.parse(statistics)).toEqual(statistics);
  });

  it("accepte un brouillon vide", () => {
    expect(draftChoicesSchema.parse(EMPTY_DRAFT_CHOICES)).toEqual(EMPTY_DRAFT_CHOICES);
  });

  it("refuse une compétence inconnue dans un brouillon", () => {
    const result = characterDraftUpdateSchema.safeParse({ choices: { chosenSkills: ["cooking"] } });
    expect(result.success).toBe(false);
  });

  it("refuse des dégâts nuls", () => {
    expect(characterActionSchema.safeParse({ type: "damage", amount: 0 }).success).toBe(false);
    expect(characterActionSchema.safeParse({ type: "damage", amount: 5 }).success).toBe(true);
  });

  it("complète une demande de montée de niveau avec des listes vides", () => {
    expect(levelUpRequestSchema.parse({ hitPointMethod: "average" })).toEqual({
      hitPointMethod: "average",
      abilityScoreImprovement: [],
      expertise: [],
      cantrips: [],
    });
  });
});
