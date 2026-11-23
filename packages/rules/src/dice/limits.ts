/** Tailles de dés autorisées : les dés du jeu. */
export const DIE_SIZES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DieSize = (typeof DIE_SIZES)[number];

/** Nombre maximal de dés dans un même groupe (par exemple 100d6). */
export const MAX_DICE_PER_GROUP = 100;

/** Plus grande constante acceptée dans une expression (couvre par exemple 4d6 * 100). */
export const MAX_CONSTANT = 1000;

/** Longueur maximale d'une expression saisie, en caractères. */
export const MAX_EXPRESSION_LENGTH = 200;

export function isDieSize(value: number): value is DieSize {
  return (DIE_SIZES as readonly number[]).includes(value);
}
