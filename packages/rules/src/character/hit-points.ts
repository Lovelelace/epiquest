/** Gain moyen d'un dé de vie, arrondi au supérieur : (d / 2) + 1. */
export function averageHitDieGain(hitDie: number): number {
  return hitDie / 2 + 1;
}

export interface HitPointInput {
  level: number;
  hitDie: number;
  constitutionModifier: number;
  /** Résultat du dé de vie pour chaque niveau après le premier. */
  gains: readonly number[];
  bonusPerLevel: number;
}

/**
 * PV maximum : dé de vie maximal au niveau 1, puis le gain de chaque niveau,
 * plus le modificateur de Constitution et le bonus d'espèce à chaque niveau.
 */
export function hitPointMaximum(input: HitPointInput): number {
  const { level, hitDie, constitutionModifier, gains, bonusPerLevel } = input;
  if (gains.length !== level - 1) {
    throw new RangeError(
      `Gains de PV invalides : ${gains.length} valeurs pour le niveau ${level} (attendu : ${level - 1})`,
    );
  }
  for (const gain of gains) {
    if (!Number.isInteger(gain) || gain < 1 || gain > hitDie) {
      throw new RangeError(`Gain de PV invalide : ${gain} (attendu : entier de 1 à ${hitDie})`);
    }
  }
  const dice = hitDie + gains.reduce((total, gain) => total + gain, 0);
  return dice + level * (constitutionModifier + bonusPerLevel);
}
