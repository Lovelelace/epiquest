import { z } from "zod";

/**
 * Terme d'une expression de dés : `NdX` (N facultatif) ou constante. Les termes sont reliés
 * par `+` ou `-` : `2d6`, `1d8 + 3`, `4d4 + 2d4 - 1`.
 *
 * Sous-ensemble volontairement réduit de la notation du moteur de dés (#9) : les modificateurs
 * (kh, kl, !, r…) n'ont pas d'usage dans les données du SRD.
 */
const TERM = String.raw`(?:\d*d[1-9]\d*|\d+)`;
const DICE_NOTATION = new RegExp(String.raw`^\s*${TERM}(?:\s*[+-]\s*${TERM})*\s*$`, "i");

// TODO(#18): valider avec l'analyseur du moteur de dés quand il sera disponible.
/** Expression de dés écrite en notation standard, interprétée par le moteur de dés. */
export const diceNotationSchema = z
  .string()
  .regex(DICE_NOTATION, "Expression de dés invalide (exemples : 2d6, 1d8 + 3)");

export type DiceNotation = z.infer<typeof diceNotationSchema>;
