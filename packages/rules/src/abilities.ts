/** Les six caractéristiques de la 5e édition (SRD 5.1). */
export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
export type Ability = (typeof ABILITIES)[number];

/** Noms français des caractéristiques, pour les libellés affichés. */
export const ABILITY_LABELS: Record<Ability, string> = {
  str: "Force",
  dex: "Dextérité",
  con: "Constitution",
  int: "Intelligence",
  wis: "Sagesse",
  cha: "Charisme",
};

/**
 * Modificateur d'une valeur de caractéristique : floor((valeur - 10) / 2).
 * Exemple : 8 → -1, 10 → 0, 15 → +2, 20 → +5.
 */
export function abilityModifier(score: number): number {
  if (!Number.isInteger(score) || score < 1 || score > 30) {
    throw new RangeError(
      `Valeur de caractéristique invalide : ${score} (attendu : entier de 1 à 30)`,
    );
  }
  return Math.floor((score - 10) / 2);
}

/**
 * Bonus de maîtrise selon le niveau du personnage : +2 aux niveaux 1 à 4,
 * puis +1 tous les 4 niveaux jusqu'à +6 au niveau 17.
 */
export function proficiencyBonus(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new RangeError(`Niveau invalide : ${level} (attendu : entier de 1 à 20)`);
  }
  return 2 + Math.floor((level - 1) / 4);
}
