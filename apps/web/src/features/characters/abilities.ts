import {
  ABILITIES,
  type Ability,
  abilityModifier,
  POINT_BUY_BUDGET,
  pointBuyCost,
  STANDARD_ARRAY,
} from "@epiquest/rules";
import type {
  AbilityMethod,
  AbilityScores,
  CharacterDraft,
  CreationOptions,
} from "@epiquest/schemas";

export const ABILITY_NAMES: Record<Ability, string> = {
  str: "Force",
  dex: "Dextérité",
  con: "Constitution",
  int: "Intelligence",
  wis: "Sagesse",
  cha: "Charisme",
};

export const METHOD_NAMES: Record<AbilityMethod, string> = {
  "point-buy": "Achat de points",
  "standard-array": "Tableau standard",
  rolled: "4d6 (garder les 3 meilleurs)",
};

export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

/** Valeurs en cours de saisie : une valeur peut manquer tant que la répartition n'est pas finie. */
export type PartialScores = Record<Ability, number | null>;

export const EMPTY_SCORES: PartialScores = {
  str: null,
  dex: null,
  con: null,
  int: null,
  wis: null,
  cha: null,
};
export const POINT_BUY_START: PartialScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

export function isComplete(scores: PartialScores): scores is AbilityScores {
  return ABILITIES.every((ability) => scores[ability] !== null);
}

/** Valeurs proposées par la méthode (tableau standard ou valeurs tirées), dans l'ordre. */
export function availableValues(method: AbilityMethod, draft: CharacterDraft): number[] {
  if (method === "standard-array") return [...STANDARD_ARRAY];
  return (draft.abilityRolls ?? []).map((roll) => roll.total);
}

/** Retire de la liste une occurrence de chaque valeur déjà attribuée. */
export function remainingValues(values: number[], scores: PartialScores): number[] {
  const remaining = [...values];
  for (const ability of ABILITIES) {
    const score = scores[ability];
    const index = score === null ? -1 : remaining.indexOf(score);
    if (index >= 0) remaining.splice(index, 1);
  }
  return remaining;
}

/** Points restants de l'achat de points, ou `null` si une valeur sort de la table. */
export function pointsLeft(scores: PartialScores): number | null {
  if (!isComplete(scores)) return null;
  const cost = pointBuyCost(scores);
  return cost === null ? null : POINT_BUY_BUDGET - cost;
}

/** La répartition est-elle valide pour sa méthode ? */
export function isValidAssignment(
  method: AbilityMethod,
  draft: CharacterDraft,
  scores: PartialScores,
): boolean {
  if (!isComplete(scores)) return false;
  if (method === "point-buy") {
    const left = pointsLeft(scores);
    return left !== null && left >= 0;
  }
  return remainingValues(availableValues(method, draft), scores).length === 0;
}

export function originBonus(options: CreationOptions | null, ability: Ability): number {
  return (options?.originBonuses ?? [])
    .filter((bonus) => bonus.ability === ability)
    .reduce((total, bonus) => total + bonus.amount, 0);
}

export function formatModifier(score: number): string {
  const modifier = abilityModifier(score);
  return modifier >= 0 ? `+${modifier}` : `−${Math.abs(modifier)}`;
}
