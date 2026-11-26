import { describe, expect, it } from "vitest";
import {
  cantripsKnown,
  CLASS_PROGRESSIONS,
  classProgression,
  expertiseCount,
  MAX_SUPPORTED_LEVEL,
  maxSpells,
} from "./class-progression.js";

const SRD_CLASSES = [
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
];

describe("progression des classes", () => {
  it("décrit les 12 classes du SRD", () => {
    expect(Object.keys(CLASS_PROGRESSIONS).sort()).toEqual(SRD_CLASSES);
  });

  it.each(SRD_CLASSES)("%s : capacités et sorts décrits pour chaque niveau de 1 à 5", (index) => {
    const progression = classProgression(index);
    for (let level = 1; level <= MAX_SUPPORTED_LEVEL; level += 1) {
      expect(progression.features[level], `niveau ${level}`).toBeDefined();
    }
    if (progression.spellcasting) {
      expect(progression.spellcasting.cantripsKnown).toHaveLength(MAX_SUPPORTED_LEVEL);
    }
    expect(progression.abilityScoreImprovementLevels).toContain(4);
  });

  it("refuse une classe inconnue", () => {
    expect(() => classProgression("artificer")).toThrow(RangeError);
  });
});

describe("maxSpells", () => {
  it("donne le nombre de sorts connus de la table", () => {
    const sorcerer = classProgression("sorcerer").spellcasting!;
    expect(maxSpells(sorcerer, 1, 3)).toBe(2);
    expect(maxSpells(sorcerer, 5, 3)).toBe(6);
  });

  it("calcule les sorts préparés : modificateur + niveau", () => {
    const cleric = classProgression("cleric").spellcasting!;
    expect(maxSpells(cleric, 1, 3)).toBe(4);
    expect(maxSpells(cleric, 1, -1)).toBe(1);
  });

  it("calcule les sorts préparés du paladin : modificateur + moitié du niveau, aucun au niveau 1", () => {
    const paladin = classProgression("paladin").spellcasting!;
    expect(maxSpells(paladin, 1, 3)).toBe(0);
    expect(maxSpells(paladin, 5, 3)).toBe(5);
  });

  it("refuse un niveau au-delà de 5", () => {
    expect(() => maxSpells(classProgression("wizard").spellcasting!, 6, 3)).toThrow(RangeError);
  });
});

describe("cantripsKnown et expertiseCount", () => {
  it("suit la table des sorts mineurs", () => {
    const wizard = classProgression("wizard").spellcasting!;
    expect(cantripsKnown(wizard, 1)).toBe(3);
    expect(cantripsKnown(wizard, 4)).toBe(4);
  });

  it("cumule l'expertise gagnée jusqu'au niveau", () => {
    expect(expertiseCount(classProgression("rogue"), 1)).toBe(2);
    expect(expertiseCount(classProgression("bard"), 2)).toBe(0);
    expect(expertiseCount(classProgression("bard"), 3)).toBe(2);
  });
});
