/** Capacité de charge : Force × 15 livres. */
export const CARRYING_CAPACITY_PER_STRENGTH = 15;
/** Règle optionnelle d'encombrement : seuils en livres par point de Force. */
export const ENCUMBERED_PER_STRENGTH = 5;
export const HEAVILY_ENCUMBERED_PER_STRENGTH = 10;
export const ENCUMBERED_SPEED_PENALTY = 10;
export const HEAVILY_ENCUMBERED_SPEED_PENALTY = 20;
/** Au-delà de la capacité de charge, la vitesse tombe à 5 pieds. */
export const OVERLOADED_SPEED = 5;

export type Encumbrance = "none" | "encumbered" | "heavily-encumbered" | "overloaded";

export interface CarryingStatus {
  weight: number;
  capacity: number;
  encumbrance: Encumbrance;
}

export function carryingCapacity(strength: number): number {
  return strength * CARRYING_CAPACITY_PER_STRENGTH;
}

/** Poids porté et niveau d'encombrement (règle optionnelle du SRD). */
export function carryingStatus(strength: number, weight: number): CarryingStatus {
  if (!Number.isFinite(weight) || weight < 0) {
    throw new RangeError(`Poids porté invalide : ${weight} (attendu : nombre positif)`);
  }
  const capacity = carryingCapacity(strength);
  let encumbrance: Encumbrance = "none";
  if (weight > capacity) encumbrance = "overloaded";
  else if (weight > strength * HEAVILY_ENCUMBERED_PER_STRENGTH) encumbrance = "heavily-encumbered";
  else if (weight > strength * ENCUMBERED_PER_STRENGTH) encumbrance = "encumbered";
  return { weight, capacity, encumbrance };
}
