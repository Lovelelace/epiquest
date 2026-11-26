import {
  type Encumbrance,
  ENCUMBERED_SPEED_PENALTY,
  HEAVILY_ENCUMBERED_SPEED_PENALTY,
  OVERLOADED_SPEED,
} from "./carrying.js";
import type { ArmorData } from "./types.js";

/** Perte de vitesse en armure lourde sans la Force requise. */
export const HEAVY_ARMOR_SPEED_PENALTY = 10;

export interface SpeedInput {
  baseSpeed: number;
  strength: number;
  armor: ArmorData | null;
  encumbrance: Encumbrance;
}

/** Vitesse de déplacement en pieds, après armure lourde et encombrement. */
export function speed(input: SpeedInput): number {
  const { baseSpeed, strength, armor, encumbrance } = input;
  if (encumbrance === "overloaded") return OVERLOADED_SPEED;
  let result = baseSpeed;
  if (armor?.strengthRequirement != null && strength < armor.strengthRequirement) {
    result -= HEAVY_ARMOR_SPEED_PENALTY;
  }
  if (encumbrance === "encumbered") result -= ENCUMBERED_SPEED_PENALTY;
  if (encumbrance === "heavily-encumbered") result -= HEAVILY_ENCUMBERED_SPEED_PENALTY;
  return Math.max(result, 0);
}
