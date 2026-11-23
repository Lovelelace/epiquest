/** Fonction de tirage d'un dé à `sides` faces, injectée (ARCH-10) : le serveur fournit un tirage sûr. */
export type RollDie = (sides: number) => number;

export const ABILITY_ROLL_DICE = 4;
export const ABILITY_ROLL_KEPT = 3;
export const ABILITY_ROLL_SIDES = 6;
export const ABILITY_SCORE_COUNT = 6;

export interface AbilityScoreRoll {
  dice: number[];
  total: number;
}

/** Un tirage 4d6 dont on garde les 3 meilleurs dés. */
export function rollAbilityScore(rollDie: RollDie): AbilityScoreRoll {
  const dice = Array.from({ length: ABILITY_ROLL_DICE }, () => rollDie(ABILITY_ROLL_SIDES));
  for (const value of dice) {
    if (!Number.isInteger(value) || value < 1 || value > ABILITY_ROLL_SIDES) {
      throw new RangeError(
        `Dé invalide : ${value} (attendu : entier de 1 à ${ABILITY_ROLL_SIDES})`,
      );
    }
  }
  const kept = [...dice].sort((a, b) => b - a).slice(0, ABILITY_ROLL_KEPT);
  return { dice, total: kept.reduce((sum, value) => sum + value, 0) };
}

/** Les six tirages de la méthode « 4d6, garder les 3 meilleurs ». */
export function rollAbilityScores(rollDie: RollDie): AbilityScoreRoll[] {
  return Array.from({ length: ABILITY_SCORE_COUNT }, () => rollAbilityScore(rollDie));
}
