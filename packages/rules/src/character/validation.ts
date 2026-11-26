import { ABILITIES } from "../abilities.js";
import { finalAbilityScores } from "./ability-scores.js";
import type { Skill } from "./skills.js";
import { highestSpellLevel, spellSlots } from "./spell-slots.js";
import type { AbilityBonus, AbilityScores, SpellcastingProgression } from "./types.js";

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 20;
export const MAX_ABILITY_SCORE = 20;
export const MIN_ROLLED_SCORE = 3;
export const MAX_ROLLED_SCORE = 18;
export const POINT_BUY_BUDGET = 27;
/** Coût de chaque valeur à l'achat de points (8 à 15). */
export const POINT_BUY_COSTS: Readonly<Record<number, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;
/** Points gagnés à chaque augmentation de caractéristique. */
export const ABILITY_SCORE_IMPROVEMENT_POINTS = 2;

export type AbilityMethod = "point-buy" | "standard-array" | "rolled";

/** Choix faits par le joueur, tels qu'il les envoie. */
export interface CharacterChoices {
  level: number;
  abilityMethod: AbilityMethod;
  baseAbilityScores: AbilityScores;
  abilityBonuses: readonly AbilityBonus[];
  chosenSkills: readonly Skill[];
  /** Compétences maîtrisées dont le bonus de maîtrise est doublé. */
  expertise: readonly Skill[];
  subclass: string | null;
  cantrips: readonly string[];
  spells: readonly string[];
}

export interface SpellOption {
  index: string;
  level: number;
}

/** Ce que la classe, l'espèce et l'historique autorisent, résolu par le serveur depuis le SRD. */
export interface CreationRules {
  skillChoice: { count: number; options: readonly Skill[] };
  /** Compétences déjà données par l'espèce et l'historique. */
  grantedSkills: readonly Skill[];
  /** Nombre de compétences avec expertise à choisir. */
  expertiseCount: number;
  subclass: { level: number; options: readonly string[] };
  abilityScoreImprovementLevels: readonly number[];
  /** Bonus d'espèce et d'historique attendus, à l'identique. */
  originBonuses: readonly AbilityBonus[];
  spellcasting: {
    progression: SpellcastingProgression;
    cantripsKnown: number;
    maxSpells: number;
    spellList: readonly SpellOption[];
  } | null;
  /** Valeurs tirées par le serveur (4d6, on garde les 3 meilleurs), pour la méthode « rolled ». */
  rolledScores: readonly number[] | null;
}

export type ValidationErrorCode =
  | "LEVEL_OUT_OF_RANGE"
  | "ABILITY_OUT_OF_RANGE"
  | "POINT_BUY_OVER_BUDGET"
  | "STANDARD_ARRAY_MISMATCH"
  | "ROLLED_SCORES_MISMATCH"
  | "ORIGIN_BONUSES_MISMATCH"
  | "ABILITY_IMPROVEMENT_MISMATCH"
  | "ABILITY_ABOVE_MAXIMUM"
  | "SKILL_COUNT"
  | "SKILL_NOT_ALLOWED"
  | "SKILL_DUPLICATE"
  | "EXPERTISE_COUNT"
  | "EXPERTISE_NOT_PROFICIENT"
  | "SUBCLASS_REQUIRED"
  | "SUBCLASS_TOO_EARLY"
  | "SUBCLASS_NOT_ALLOWED"
  | "NOT_A_SPELLCASTER"
  | "CANTRIP_COUNT"
  | "SPELL_COUNT"
  | "SPELL_NOT_ALLOWED"
  | "SPELL_LEVEL_TOO_HIGH"
  | "SPELL_DUPLICATE";

export interface ValidationError {
  code: ValidationErrorCode;
  /** Message en français, compréhensible par un joueur. */
  message: string;
  /** Champ concerné dans les choix, par exemple `chosenSkills.2`. */
  path: string;
}

type Errors = ValidationError[];

function sameMultiset(left: readonly number[], right: readonly number[]): boolean {
  const sort = (values: readonly number[]): number[] => [...values].sort((a, b) => a - b);
  return JSON.stringify(sort(left)) === JSON.stringify(sort(right));
}

function bonusKey(bonus: AbilityBonus): string {
  return `${bonus.source}:${bonus.ability}:${bonus.amount}`;
}

function validateBaseScores(choices: CharacterChoices, rules: CreationRules, errors: Errors): void {
  const scores = ABILITIES.map((ability) => choices.baseAbilityScores[ability]);
  const bounds =
    choices.abilityMethod === "point-buy" ? [8, 15] : [MIN_ROLLED_SCORE, MAX_ROLLED_SCORE];
  for (const ability of ABILITIES) {
    const score = choices.baseAbilityScores[ability];
    if (!Number.isInteger(score) || score < (bounds[0] ?? 0) || score > (bounds[1] ?? 0)) {
      errors.push({
        code: "ABILITY_OUT_OF_RANGE",
        message: `La valeur de base ${score} doit être un entier entre ${bounds[0]} et ${bounds[1]}.`,
        path: `baseAbilityScores.${ability}`,
      });
    }
  }
  if (errors.length > 0) return;
  if (choices.abilityMethod === "point-buy") {
    const cost = pointBuyCost(choices.baseAbilityScores) ?? 0;
    if (cost > POINT_BUY_BUDGET) {
      errors.push({
        code: "POINT_BUY_OVER_BUDGET",
        message: `L'achat de points coûte ${cost} points, pour un budget de ${POINT_BUY_BUDGET}.`,
        path: "baseAbilityScores",
      });
    }
  } else if (choices.abilityMethod === "standard-array") {
    if (!sameMultiset(scores, STANDARD_ARRAY)) {
      errors.push({
        code: "STANDARD_ARRAY_MISMATCH",
        message: `Le tableau standard répartit exactement les valeurs ${STANDARD_ARRAY.join(", ")}.`,
        path: "baseAbilityScores",
      });
    }
  } else if (!rules.rolledScores || !sameMultiset(scores, rules.rolledScores)) {
    errors.push({
      code: "ROLLED_SCORES_MISMATCH",
      message: "Les valeurs doivent être celles tirées par le serveur, réparties au choix.",
      path: "baseAbilityScores",
    });
  }
}

function validateBonuses(choices: CharacterChoices, rules: CreationRules, errors: Errors): void {
  const origin = choices.abilityBonuses.filter(
    (bonus) => bonus.source !== "ability-score-improvement",
  );
  const expected = rules.originBonuses.map(bonusKey).sort();
  if (JSON.stringify(origin.map(bonusKey).sort()) !== JSON.stringify(expected)) {
    errors.push({
      code: "ORIGIN_BONUSES_MISMATCH",
      message:
        "Les bonus de caractéristique ne correspondent pas à l'espèce et à l'historique choisis.",
      path: "abilityBonuses",
    });
  }
  const improvements = choices.abilityBonuses.filter(
    (bonus) => bonus.source === "ability-score-improvement",
  );
  const earned =
    rules.abilityScoreImprovementLevels.filter((level) => level <= choices.level).length *
    ABILITY_SCORE_IMPROVEMENT_POINTS;
  const spent = improvements.reduce((total, bonus) => total + bonus.amount, 0);
  const isWellFormed = improvements.every((bonus) => bonus.amount === 1 || bonus.amount === 2);
  if (spent !== earned || !isWellFormed) {
    errors.push({
      code: "ABILITY_IMPROVEMENT_MISMATCH",
      message: `Les augmentations de caractéristique doivent répartir ${earned} points (+1 ou +2 à la fois).`,
      path: "abilityBonuses",
    });
  }
  const final = finalAbilityScores(choices.baseAbilityScores, choices.abilityBonuses);
  for (const ability of ABILITIES) {
    if (final[ability] > MAX_ABILITY_SCORE) {
      errors.push({
        code: "ABILITY_ABOVE_MAXIMUM",
        message: `Une caractéristique ne peut pas dépasser ${MAX_ABILITY_SCORE} (valeur obtenue : ${final[ability]}).`,
        path: `abilityBonuses.${ability}`,
      });
    }
  }
}

function validateSkills(choices: CharacterChoices, rules: CreationRules, errors: Errors): void {
  const { count, options } = rules.skillChoice;
  if (choices.chosenSkills.length !== count) {
    errors.push({
      code: "SKILL_COUNT",
      message: `Choisissez exactement ${count} compétences de classe (${choices.chosenSkills.length} choisies).`,
      path: "chosenSkills",
    });
  }
  choices.chosenSkills.forEach((skill, position) => {
    const path = `chosenSkills.${position}`;
    if (!options.includes(skill)) {
      errors.push({
        code: "SKILL_NOT_ALLOWED",
        message: `La compétence « ${skill} » n'est pas proposée par cette classe.`,
        path,
      });
    } else if (
      rules.grantedSkills.includes(skill) ||
      choices.chosenSkills.indexOf(skill) !== position
    ) {
      errors.push({
        code: "SKILL_DUPLICATE",
        message: `La compétence « ${skill} » est déjà maîtrisée.`,
        path,
      });
    }
  });
}

function validateExpertise(choices: CharacterChoices, rules: CreationRules, errors: Errors): void {
  if (choices.expertise.length !== rules.expertiseCount) {
    errors.push({
      code: "EXPERTISE_COUNT",
      message: `Choisissez exactement ${rules.expertiseCount} compétences pour l'expertise (${choices.expertise.length} choisies).`,
      path: "expertise",
    });
  }
  const proficient = [...rules.grantedSkills, ...choices.chosenSkills];
  choices.expertise.forEach((skill, position) => {
    if (!proficient.includes(skill) || choices.expertise.indexOf(skill) !== position) {
      errors.push({
        code: "EXPERTISE_NOT_PROFICIENT",
        message: `L'expertise demande une compétence maîtrisée, choisie une seule fois (« ${skill} »).`,
        path: `expertise.${position}`,
      });
    }
  });
}

function validateSubclass(choices: CharacterChoices, rules: CreationRules, errors: Errors): void {
  const { level, options } = rules.subclass;
  if (choices.level < level) {
    if (choices.subclass !== null) {
      errors.push({
        code: "SUBCLASS_TOO_EARLY",
        message: `La sous-classe se choisit au niveau ${level}.`,
        path: "subclass",
      });
    }
  } else if (choices.subclass === null) {
    errors.push({
      code: "SUBCLASS_REQUIRED",
      message: `Choisissez une sous-classe (dès le niveau ${level}).`,
      path: "subclass",
    });
  } else if (!options.includes(choices.subclass)) {
    errors.push({
      code: "SUBCLASS_NOT_ALLOWED",
      message: "Cette sous-classe n'existe pas pour cette classe.",
      path: "subclass",
    });
  }
}

function validateSpellList(
  field: "cantrips" | "spells",
  choices: CharacterChoices,
  spellcasting: NonNullable<CreationRules["spellcasting"]>,
  maxLevel: number,
  errors: Errors,
): void {
  const chosen = choices[field];
  chosen.forEach((index, position) => {
    const path = `${field}.${position}`;
    const option = spellcasting.spellList.find((spell) => spell.index === index);
    const isCantrip = field === "cantrips";
    if (!option || (option.level === 0) !== isCantrip) {
      errors.push({
        code: "SPELL_NOT_ALLOWED",
        message: `Le sort « ${index} » n'est pas dans la liste de la classe.`,
        path,
      });
    } else if (!isCantrip && option.level > maxLevel) {
      errors.push({
        code: "SPELL_LEVEL_TOO_HIGH",
        message: `Le sort « ${index} » est de niveau ${option.level}, au-delà du niveau ${maxLevel} accessible.`,
        path,
      });
    } else if (chosen.indexOf(index) !== position) {
      errors.push({
        code: "SPELL_DUPLICATE",
        message: `Le sort « ${index} » est choisi deux fois.`,
        path,
      });
    }
  });
}

function validateSpells(choices: CharacterChoices, rules: CreationRules, errors: Errors): void {
  const spellcasting = rules.spellcasting;
  if (!spellcasting) {
    if (choices.cantrips.length > 0 || choices.spells.length > 0) {
      errors.push({
        code: "NOT_A_SPELLCASTER",
        message: "Cette classe ne lance pas de sorts.",
        path: "spells",
      });
    }
    return;
  }
  if (choices.cantrips.length !== spellcasting.cantripsKnown) {
    errors.push({
      code: "CANTRIP_COUNT",
      message: `Choisissez exactement ${spellcasting.cantripsKnown} sorts mineurs (${choices.cantrips.length} choisis).`,
      path: "cantrips",
    });
  }
  if (choices.spells.length > spellcasting.maxSpells) {
    errors.push({
      code: "SPELL_COUNT",
      message: `Choisissez au plus ${spellcasting.maxSpells} sorts (${choices.spells.length} choisis).`,
      path: "spells",
    });
  }
  const maxLevel = highestSpellLevel(spellSlots(spellcasting.progression, choices.level));
  validateSpellList("cantrips", choices, spellcasting, maxLevel, errors);
  validateSpellList("spells", choices, spellcasting, maxLevel, errors);
}

/**
 * Vérifie que les choix d'un personnage respectent les règles. Renvoie la liste
 * des erreurs, vide si tout est valide. Le serveur l'applique avant d'enregistrer ;
 * l'assistant web l'utilise pour guider le joueur.
 */
export function validateCharacterChoices(
  choices: CharacterChoices,
  rules: CreationRules,
): ValidationError[] {
  if (!Number.isInteger(choices.level) || choices.level < MIN_LEVEL || choices.level > MAX_LEVEL) {
    return [
      {
        code: "LEVEL_OUT_OF_RANGE",
        message: `Le niveau doit être un entier entre ${MIN_LEVEL} et ${MAX_LEVEL}.`,
        path: "level",
      },
    ];
  }
  const errors: Errors = [];
  validateBaseScores(choices, rules, errors);
  if (errors.length === 0) validateBonuses(choices, rules, errors);
  validateSkills(choices, rules, errors);
  validateExpertise(choices, rules, errors);
  validateSubclass(choices, rules, errors);
  validateSpells(choices, rules, errors);
  return errors;
}

/** Coût total d'une répartition à l'achat de points, ou `null` si une valeur est hors de 8 à 15. */
export function pointBuyCost(scores: AbilityScores): number | null {
  let total = 0;
  for (const ability of ABILITIES) {
    const cost = POINT_BUY_COSTS[scores[ability]];
    if (cost === undefined) return null;
    total += cost;
  }
  return total;
}
