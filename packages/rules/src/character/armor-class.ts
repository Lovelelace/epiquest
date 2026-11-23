import type { Ability } from "../abilities.js";
import type { ArmorClassBonus, ArmorData, UnarmoredDefense } from "./types.js";

export const UNARMORED_BASE_ARMOR_CLASS = 10;
export const SHIELD_ARMOR_CLASS_BONUS = 2;

export interface ArmorClassInput {
  modifiers: Record<Ability, number>;
  armor: ArmorData | null;
  hasShield: boolean;
  unarmoredDefense: UnarmoredDefense | null;
  bonuses: readonly ArmorClassBonus[];
}

/** L'armure lourde ignore la Dextérité, même négative ; les autres la plafonnent. */
function armoredBase(armor: ArmorData, dexterity: number): number {
  if (armor.category === "heavy") return armor.baseArmorClass;
  const dexterityPart =
    armor.dexterityCap === null ? dexterity : Math.min(dexterity, armor.dexterityCap);
  return armor.baseArmorClass + dexterityPart;
}

/**
 * Classe d'armure. Quand plusieurs formules de base s'appliquent (sans armure,
 * défense sans armure), on garde la meilleure ; elles ne se cumulent pas.
 * Le bouclier et les bonus s'ajoutent ensuite.
 */
export function armorClass(input: ArmorClassInput): number {
  const { modifiers, armor, hasShield, unarmoredDefense } = input;
  let base: number;
  if (armor) {
    base = armoredBase(armor, modifiers.dex);
  } else {
    base = UNARMORED_BASE_ARMOR_CLASS + modifiers.dex;
    if (unarmoredDefense && (unarmoredDefense.allowsShield || !hasShield)) {
      base = Math.max(base, base + modifiers[unarmoredDefense.ability]);
    }
  }
  const shield = hasShield ? SHIELD_ARMOR_CLASS_BONUS : 0;
  const bonuses = input.bonuses
    .filter((bonus) => !bonus.requiresArmor || armor !== null)
    .reduce((total, bonus) => total + bonus.amount, 0);
  return base + shield + bonuses;
}
