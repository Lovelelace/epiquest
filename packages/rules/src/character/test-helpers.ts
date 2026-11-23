import type { ArmorData, CharacterBuild, ClassData } from "./types.js";

/** Données de test reprises du SRD 5.1. */
export const FIGHTER: ClassData = {
  index: "fighter",
  hitDie: 10,
  savingThrows: ["str", "con"],
  spellcasting: null,
  unarmoredDefense: null,
};

export const CHAIN_MAIL: ArmorData = {
  category: "heavy",
  baseArmorClass: 16,
  dexterityCap: 0,
  strengthRequirement: 13,
  hasStealthDisadvantage: true,
};

export const SCALE_MAIL: ArmorData = {
  category: "medium",
  baseArmorClass: 14,
  dexterityCap: 2,
  strengthRequirement: null,
  hasStealthDisadvantage: true,
};

export const LEATHER: ArmorData = {
  category: "light",
  baseArmorClass: 11,
  dexterityCap: null,
  strengthRequirement: null,
  hasStealthDisadvantage: false,
};

/** Personnage de niveau 1 neutre, à surcharger dans chaque test. */
export function makeBuild(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    level: 1,
    classData: FIGHTER,
    species: { index: "human", speed: 30, hitPointBonusPerLevel: 0 },
    baseAbilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilityBonuses: [],
    skillProficiencies: [],
    skillExpertise: [],
    hitPointGains: [],
    armor: null,
    hasShield: false,
    armorClassBonuses: [],
    carriedWeight: 0,
    ...overrides,
  };
}
