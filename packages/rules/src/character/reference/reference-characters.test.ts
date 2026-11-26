import { describe, expect, it } from "vitest";
import { deriveStatistics } from "../derive.js";
import type { CharacterBuild } from "../types.js";
import highElfWizard from "./high-elf-wizard.json" with { type: "json" };
import hillDwarfCleric from "./hill-dwarf-cleric.json" with { type: "json" };
import humanFighter from "./human-fighter.json" with { type: "json" };
import lightfootHalflingRogue from "./lightfoot-halfling-rogue.json" with { type: "json" };

interface ReferenceLevel {
  build: CharacterBuild;
  handCalculation: string[];
  expected: unknown;
}

interface ReferenceCharacter {
  id: string;
  name: string;
  levels: Record<string, ReferenceLevel>;
}

// Le JSON importé a des chaînes larges ("heavy" devient string) : son format est décrit dans le README.
const references = [
  humanFighter,
  highElfWizard,
  hillDwarfCleric,
  lightfootHalflingRogue,
] as unknown as ReferenceCharacter[];

describe("personnages de référence", () => {
  it("couvre 4 personnages de classes et d'espèces différentes, dont un lanceur de sorts", () => {
    expect(references).toHaveLength(4);
    const levels = references.flatMap((reference) => Object.values(reference.levels));
    expect(new Set(levels.map((level) => level.build.classData.index)).size).toBe(4);
    expect(new Set(levels.map((level) => level.build.species.index)).size).toBe(4);
    expect(levels.some((level) => level.build.classData.spellcasting !== null)).toBe(true);
  });

  describe.each(references.map((reference) => [reference.name, reference] as const))(
    "%s",
    (_name, reference) => {
      it.each(["1", "5"])("donne la fiche calculée à la main au niveau %s", (level) => {
        const entry = reference.levels[level];
        expect(entry, `niveau ${level} absent de ${reference.id}`).toBeDefined();
        expect(entry?.handCalculation.length).toBeGreaterThan(0);
        expect(deriveStatistics(entry!.build)).toEqual(entry!.expected);
      });
    },
  );
});
