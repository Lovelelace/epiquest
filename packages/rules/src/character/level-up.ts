import type { RollDie } from "./ability-rolls.js";
import {
  cantripsKnown,
  type ClassProgression,
  expertiseCount,
  MAX_SUPPORTED_LEVEL,
} from "./class-progression.js";
import { averageHitDieGain } from "./hit-points.js";

export type HitPointMethod = "average" | "roll";

/** Gain de PV d'un nouveau niveau : la moyenne du dé de vie, ou un jet tiré par le serveur. */
export function hitPointGain(method: HitPointMethod, hitDie: number, rollDie: RollDie): number {
  return method === "average" ? averageHitDieGain(hitDie) : rollDie(hitDie);
}

/** Ce que le passage au niveau suivant apporte, pour guider le joueur. */
export interface LevelUpGains {
  nextLevel: number;
  /** La sous-classe se choisit à ce niveau. */
  choosesSubclass: boolean;
  abilityScoreImprovement: boolean;
  expertiseCount: number;
  newCantrips: number;
}

/** Gains du niveau suivant ; lève une erreur au-delà du niveau maximal pris en charge. */
export function levelUpGains(progression: ClassProgression, currentLevel: number): LevelUpGains {
  const nextLevel = currentLevel + 1;
  if (nextLevel > MAX_SUPPORTED_LEVEL) {
    throw new RangeError(`Niveau maximal atteint : ${MAX_SUPPORTED_LEVEL}`);
  }
  const spellcasting = progression.spellcasting;
  return {
    nextLevel,
    choosesSubclass: progression.subclassLevel === nextLevel,
    abilityScoreImprovement: progression.abilityScoreImprovementLevels.includes(nextLevel),
    expertiseCount:
      expertiseCount(progression, nextLevel) - expertiseCount(progression, currentLevel),
    newCantrips: spellcasting
      ? cantripsKnown(spellcasting, nextLevel) - cantripsKnown(spellcasting, currentLevel)
      : 0,
  };
}

/** Emplacements dépensés après une montée de niveau : les nouveaux emplacements sont libres. */
export function extendUsedSlots(used: readonly number[], slotCount: number): number[] {
  return Array.from({ length: slotCount }, (_, index) => used[index] ?? 0);
}
