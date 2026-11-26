import type { SpellcastingProgression } from "./types.js";

/** Emplacements de sorts d'un lanceur complet, par niveau de personnage (index 0 = niveau 1). */
const FULL_CASTER_SLOTS: readonly (readonly number[])[] = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/** Magie de pacte (occultiste) : nombre d'emplacements et leur niveau, par niveau de personnage. */
const PACT_SLOTS: readonly { count: number; slotLevel: number }[] = [
  { count: 1, slotLevel: 1 },
  { count: 2, slotLevel: 1 },
  { count: 2, slotLevel: 2 },
  { count: 2, slotLevel: 2 },
  { count: 2, slotLevel: 3 },
  { count: 2, slotLevel: 3 },
  { count: 2, slotLevel: 4 },
  { count: 2, slotLevel: 4 },
  { count: 2, slotLevel: 5 },
  { count: 2, slotLevel: 5 },
  ...Array.from({ length: 6 }, () => ({ count: 3, slotLevel: 5 })),
  ...Array.from({ length: 4 }, () => ({ count: 4, slotLevel: 5 })),
];

export interface SpellSlots {
  /** Nombre d'emplacements par niveau de sort (index 0 = sorts du 1er niveau). */
  slots: readonly number[];
  /** Emplacements de pacte, rechargés par un repos court. */
  pact: { count: number; slotLevel: number } | null;
}

const NO_SLOTS: SpellSlots = { slots: [], pact: null };

function assertLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1 || level > FULL_CASTER_SLOTS.length) {
    throw new RangeError(`Niveau invalide : ${level} (attendu : entier de 1 à 20)`);
  }
}

/**
 * Emplacements de sorts selon la progression de la classe. Un demi-lanceur
 * (paladin, rôdeur) n'en a pas au niveau 1, puis suit la table complète à la
 * moitié de son niveau, arrondie au supérieur.
 */
export function spellSlots(progression: SpellcastingProgression | null, level: number): SpellSlots {
  assertLevel(level);
  switch (progression) {
    case null:
      return NO_SLOTS;
    case "full":
      return { slots: FULL_CASTER_SLOTS[level - 1] ?? [], pact: null };
    case "half":
      return level === 1
        ? NO_SLOTS
        : { slots: FULL_CASTER_SLOTS[Math.ceil(level / 2) - 1] ?? [], pact: null };
    case "pact":
      return { slots: [], pact: PACT_SLOTS[level - 1] ?? null };
  }
}

/** Niveau de sort le plus élevé accessible (0 si seulement des sorts mineurs ou aucun). */
export function highestSpellLevel(slots: SpellSlots): number {
  return Math.max(slots.slots.length, slots.pact?.slotLevel ?? 0);
}
