import { ABILITIES, type Ability, abilityModifier } from "../abilities.js";
import type { AbilityBonus, AbilityScores } from "./types.js";

/** Valeurs finales : valeurs de base plus tous les bonus (espèce, historique, augmentations). */
export function finalAbilityScores(
  base: AbilityScores,
  bonuses: readonly AbilityBonus[],
): AbilityScores {
  const scores = { ...base };
  for (const bonus of bonuses) {
    scores[bonus.ability] += bonus.amount;
  }
  return scores;
}

/** Modificateur de chaque caractéristique. */
export function abilityModifiers(scores: AbilityScores): Record<Ability, number> {
  const modifiers = {} as Record<Ability, number>; // rempli pour chaque clé juste en dessous
  for (const ability of ABILITIES) {
    modifiers[ability] = abilityModifier(scores[ability]);
  }
  return modifiers;
}
