import type { Ability } from "../abilities.js";

/** Les 18 compétences du SRD et la caractéristique associée. */
export const SKILL_ABILITIES = {
  acrobatics: "dex",
  "animal-handling": "wis",
  arcana: "int",
  athletics: "str",
  deception: "cha",
  history: "int",
  insight: "wis",
  intimidation: "cha",
  investigation: "int",
  medicine: "wis",
  nature: "int",
  perception: "wis",
  performance: "cha",
  persuasion: "cha",
  religion: "int",
  "sleight-of-hand": "dex",
  stealth: "dex",
  survival: "wis",
} as const satisfies Record<string, Ability>;

export type Skill = keyof typeof SKILL_ABILITIES;

/** Liste des compétences dans un ordre stable. */
export const SKILLS = Object.keys(SKILL_ABILITIES) as Skill[]; // clés littérales de l'objet ci-dessus

export function isSkill(value: string): value is Skill {
  return Object.hasOwn(SKILL_ABILITIES, value);
}
