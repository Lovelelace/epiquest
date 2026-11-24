import { randomInt } from "node:crypto";

/** Résultat d'un jet, avant d'être daté et rangé dans l'historique de la table. */
export interface DiceOutcome {
  dice: number[];
  modifier: number;
  total: number;
}

/**
 * Interface du moteur de dés (ARCH-14). La table ne connaît que cette fonction ; le moteur
 * complet d'Aurélien (#26) la remplacera.
 */
export interface DiceRoller {
  /** Lance la notation, ou renvoie `null` si elle n'est pas reconnue. */
  roll(notation: string): DiceOutcome | null;
}

export const DICE_ROLLER = Symbol("DICE_ROLLER");

/** Tire un entier dans [min, max[ ; injecté pour fixer l'aléatoire dans les tests (ARCH-10). */
export type RandomInt = (min: number, maxExclusive: number) => number;

const MAX_DICE_COUNT = 20;
const MAX_MODIFIER = 100;
const ALLOWED_FACES = new Set([4, 6, 8, 10, 12, 20, 100]);
const SIMPLE_NOTATION = /^(\d{1,2})?d(\d{1,3})(?:\s*([+-])\s*(\d{1,3}))?$/i;

/**
 * Implémentation minimale : `NdM`, `NdM+K`, `NdM-K`, tirée avec `crypto.randomInt` (SEC-02).
 * TODO(#26): remplacer par l'évaluation du moteur de dés.
 */
export class SimpleDiceRoller implements DiceRoller {
  constructor(private readonly random: RandomInt = randomInt) {}

  roll(notation: string): DiceOutcome | null {
    const match = SIMPLE_NOTATION.exec(notation.trim());
    if (match === null) return null;
    const [, countText, facesText, sign, modifierText] = match;
    const count = countText === undefined ? 1 : Number(countText);
    const faces = Number(facesText);
    const modifier =
      modifierText === undefined ? 0 : Number(modifierText) * (sign === "-" ? -1 : 1);
    if (count < 1 || count > MAX_DICE_COUNT || !ALLOWED_FACES.has(faces)) return null;
    if (Math.abs(modifier) > MAX_MODIFIER) return null;

    const dice = Array.from({ length: count }, () => this.random(1, faces + 1));
    return { dice, modifier, total: dice.reduce((sum, value) => sum + value, modifier) };
  }
}
