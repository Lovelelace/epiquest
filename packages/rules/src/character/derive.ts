import { ABILITIES, type Ability, proficiencyBonus } from "../abilities.js";
import { abilityModifiers, finalAbilityScores } from "./ability-scores.js";
import { armorClass } from "./armor-class.js";
import { type CarryingStatus, carryingStatus } from "./carrying.js";
import { hitPointMaximum } from "./hit-points.js";
import { SKILL_ABILITIES, SKILLS, type Skill } from "./skills.js";
import { speed } from "./speed.js";
import { type SpellSlots, spellSlots } from "./spell-slots.js";
import type { AbilityScores, CharacterBuild } from "./types.js";

/** Base fixe du DD des sorts et de la Perception passive. */
export const SPELL_SAVE_DC_BASE = 8;
export const PASSIVE_CHECK_BASE = 10;

export type ProficiencyLevel = "none" | "proficient" | "expertise";

export interface CheckModifier {
  modifier: number;
  proficiency: ProficiencyLevel;
}

export interface SpellcastingStatistics {
  ability: Ability;
  saveDc: number;
  attackBonus: number;
  slots: SpellSlots;
}

export interface DerivedStatistics {
  level: number;
  abilityScores: AbilityScores;
  abilityModifiers: Record<Ability, number>;
  proficiencyBonus: number;
  savingThrows: Record<Ability, CheckModifier>;
  skills: Record<Skill, CheckModifier>;
  armorClass: number;
  hasStealthDisadvantage: boolean;
  hitPointMaximum: number;
  hitDice: { die: number; count: number };
  initiative: number;
  speed: number;
  passivePerception: number;
  spellcasting: SpellcastingStatistics | null;
  carrying: CarryingStatus;
}

const PROFICIENCY_MULTIPLIER: Record<ProficiencyLevel, number> = {
  none: 0,
  proficient: 1,
  expertise: 2,
};

function check(modifier: number, proficiency: ProficiencyLevel, bonus: number): CheckModifier {
  return { modifier: modifier + PROFICIENCY_MULTIPLIER[proficiency] * bonus, proficiency };
}

/** Modificateur des jets de sauvegarde, maîtrisés selon la classe. */
export function savingThrows(
  modifiers: Record<Ability, number>,
  proficient: readonly Ability[],
  bonus: number,
): Record<Ability, CheckModifier> {
  const result = {} as Record<Ability, CheckModifier>; // rempli pour chaque caractéristique
  for (const ability of ABILITIES) {
    result[ability] = check(
      modifiers[ability],
      proficient.includes(ability) ? "proficient" : "none",
      bonus,
    );
  }
  return result;
}

/** Modificateur de chaque compétence ; l'expertise double le bonus de maîtrise. */
export function skillModifiers(
  modifiers: Record<Ability, number>,
  proficient: readonly Skill[],
  expertise: readonly Skill[],
  bonus: number,
): Record<Skill, CheckModifier> {
  const result = {} as Record<Skill, CheckModifier>; // rempli pour chaque compétence
  for (const skill of SKILLS) {
    const level: ProficiencyLevel = expertise.includes(skill)
      ? "expertise"
      : proficient.includes(skill)
        ? "proficient"
        : "none";
    result[skill] = check(modifiers[SKILL_ABILITIES[skill]], level, bonus);
  }
  return result;
}

/** DD de sauvegarde et bonus d'attaque des sorts : 8 + maîtrise + modificateur. */
export function spellcastingStatistics(
  build: CharacterBuild,
  modifiers: Record<Ability, number>,
  bonus: number,
): SpellcastingStatistics | null {
  const spellcasting = build.classData.spellcasting;
  if (!spellcasting) return null;
  const modifier = modifiers[spellcasting.ability];
  return {
    ability: spellcasting.ability,
    saveDc: SPELL_SAVE_DC_BASE + bonus + modifier,
    attackBonus: bonus + modifier,
    slots: spellSlots(spellcasting.progression, build.level),
  };
}

/** Calcule toutes les statistiques dérivées d'un personnage. Fonction pure. */
export function deriveStatistics(build: CharacterBuild): DerivedStatistics {
  const scores = finalAbilityScores(build.baseAbilityScores, build.abilityBonuses);
  const modifiers = abilityModifiers(scores);
  const bonus = proficiencyBonus(build.level);
  const skills = skillModifiers(modifiers, build.skillProficiencies, build.skillExpertise, bonus);
  const carrying = carryingStatus(scores.str, build.carriedWeight);
  return {
    level: build.level,
    abilityScores: scores,
    abilityModifiers: modifiers,
    proficiencyBonus: bonus,
    savingThrows: savingThrows(modifiers, build.classData.savingThrows, bonus),
    skills,
    armorClass: armorClass({
      modifiers,
      armor: build.armor,
      hasShield: build.hasShield,
      unarmoredDefense: build.classData.unarmoredDefense,
      bonuses: build.armorClassBonuses,
    }),
    hasStealthDisadvantage: build.armor?.hasStealthDisadvantage ?? false,
    hitPointMaximum: hitPointMaximum({
      level: build.level,
      hitDie: build.classData.hitDie,
      constitutionModifier: modifiers.con,
      gains: build.hitPointGains,
      bonusPerLevel: build.species.hitPointBonusPerLevel,
    }),
    hitDice: { die: build.classData.hitDie, count: build.level },
    initiative: modifiers.dex,
    speed: speed({
      baseSpeed: build.species.speed,
      strength: scores.str,
      armor: build.armor,
      encumbrance: carrying.encumbrance,
    }),
    passivePerception: PASSIVE_CHECK_BASE + skills.perception.modifier,
    spellcasting: spellcastingStatistics(build, modifiers, bonus),
    carrying,
  };
}
