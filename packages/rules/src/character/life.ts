import type { RollDie } from "./ability-rolls.js";

/** Erreur de règle sur l'état du personnage, avec un code stable (CODE-16). */
export class LifeRuleError extends Error {
  constructor(
    readonly code: "NO_HIT_DICE_LEFT" | "INSUFFICIENT_FUNDS" | "ITEM_NOT_IN_INVENTORY",
    message: string,
  ) {
    super(message);
  }
}

export interface HitPoints {
  current: number;
  temporary: number;
}

/** Dégâts : les PV temporaires sont perdus en premier, les PV ne descendent pas sous 0. */
export function applyDamage(hitPoints: HitPoints, amount: number): HitPoints {
  const absorbed = Math.min(hitPoints.temporary, amount);
  return {
    temporary: hitPoints.temporary - absorbed,
    current: Math.max(0, hitPoints.current - (amount - absorbed)),
  };
}

/** Soins : jamais au-delà du maximum ; les PV temporaires ne sont pas soignés. */
export function heal(hitPoints: HitPoints, amount: number, maximum: number): HitPoints {
  return { ...hitPoints, current: Math.min(maximum, hitPoints.current + amount) };
}

/** Les PV temporaires ne se cumulent pas : on garde la valeur la plus haute. */
export function grantTemporaryHitPoints(hitPoints: HitPoints, amount: number): HitPoints {
  return { ...hitPoints, temporary: Math.max(hitPoints.temporary, amount) };
}

export interface RestState {
  hitPoints: HitPoints;
  hitDiceRemaining: number;
  spellSlotsUsed: number[];
  pactSlotsUsed: number;
}

export interface ShortRestInput {
  state: RestState;
  hitDiceToSpend: number;
  hitDie: number;
  constitutionModifier: number;
  maximum: number;
  rollDie: RollDie;
}

export interface ShortRestResult {
  state: RestState;
  /** Chaque dé de vie dépensé et les PV qu'il rend (dé + Con, au moins 0). */
  rolls: { value: number; healed: number }[];
}

/**
 * Repos court : chaque dé de vie dépensé rend son résultat plus le modificateur de Constitution.
 * Les emplacements de magie de pacte sont récupérés.
 */
export function shortRest(input: ShortRestInput): ShortRestResult {
  const { state, hitDiceToSpend, hitDie, constitutionModifier, maximum, rollDie } = input;
  if (hitDiceToSpend > state.hitDiceRemaining) {
    throw new LifeRuleError(
      "NO_HIT_DICE_LEFT",
      `Il reste ${state.hitDiceRemaining} dés de vie : impossible d'en dépenser ${hitDiceToSpend}.`,
    );
  }
  const rolls = Array.from({ length: hitDiceToSpend }, () => {
    const value = rollDie(hitDie);
    return { value, healed: Math.max(0, value + constitutionModifier) };
  });
  const healed = rolls.reduce((total, roll) => total + roll.healed, 0);
  return {
    rolls,
    state: {
      ...state,
      hitPoints: heal(state.hitPoints, healed, maximum),
      hitDiceRemaining: state.hitDiceRemaining - hitDiceToSpend,
      pactSlotsUsed: 0,
    },
  };
}

/**
 * Repos long : tous les PV, perte des PV temporaires, tous les emplacements, et récupération
 * de la moitié des dés de vie (au moins 1), sans dépasser le niveau.
 */
export function longRest(state: RestState, maximum: number, level: number): RestState {
  const recovered = Math.max(1, Math.floor(level / 2));
  return {
    hitPoints: { current: maximum, temporary: 0 },
    hitDiceRemaining: Math.min(level, state.hitDiceRemaining + recovered),
    spellSlotsUsed: state.spellSlotsUsed.map(() => 0),
    pactSlotsUsed: 0,
  };
}

// ---------------------------------------------------------------------------
// Argent

export const COINS = ["cp", "sp", "ep", "gp", "pp"] as const;
export type Coin = (typeof COINS)[number];
export type Coins = Record<Coin, number>;

/** Valeur de chaque pièce en pièces de cuivre. */
export const COIN_VALUES_IN_COPPER: Readonly<Record<Coin, number>> = {
  cp: 1,
  sp: 10,
  ep: 50,
  gp: 100,
  pp: 1000,
};

export function totalInCopper(coins: Coins): number {
  return COINS.reduce((total, coin) => total + coins[coin] * COIN_VALUES_IN_COPPER[coin], 0);
}

/**
 * Ajoute ou retire des pièces. Quand une pièce manque, on fait la monnaie avec la plus petite
 * pièce supérieure disponible (1 po → 2 pe, 1 pe → 5 pa…). Refuse si la bourse ne suffit pas.
 */
export function changeMoney(coins: Coins, delta: Partial<Coins>): Coins {
  const result = { ...coins };
  for (const coin of COINS) result[coin] += delta[coin] ?? 0;
  if (totalInCopper(result) < 0) {
    throw new LifeRuleError("INSUFFICIENT_FUNDS", "La bourse ne contient pas assez d'argent.");
  }
  COINS.forEach((coin, index) => {
    while (result[coin] < 0) {
      const larger = COINS.slice(index + 1).find((candidate) => result[candidate] > 0);
      if (!larger)
        throw new LifeRuleError("INSUFFICIENT_FUNDS", "La bourse ne contient pas assez d'argent.");
      // Une pièce se change en pièces de la taille juste en dessous, jusqu'à atteindre `coin`.
      const below = COINS[COINS.indexOf(larger) - 1] ?? coin;
      result[larger] -= 1;
      result[below] += COIN_VALUES_IN_COPPER[larger] / COIN_VALUES_IN_COPPER[below];
    }
  });
  return result;
}

// ---------------------------------------------------------------------------
// Inventaire

export interface InventoryEntry {
  slug: string;
  name: string;
  quantity: number;
  weight: number;
  isEquipped: boolean;
}

export function addItem(
  inventory: InventoryEntry[],
  item: Omit<InventoryEntry, "isEquipped">,
): InventoryEntry[] {
  const existing = inventory.find((entry) => entry.slug === item.slug);
  if (existing) {
    return inventory.map((entry) =>
      entry.slug === item.slug ? { ...entry, quantity: entry.quantity + item.quantity } : entry,
    );
  }
  return [...inventory, { ...item, isEquipped: false }];
}

export function removeItem(
  inventory: InventoryEntry[],
  slug: string,
  quantity: number,
): InventoryEntry[] {
  const existing = inventory.find((entry) => entry.slug === slug);
  if (!existing)
    throw new LifeRuleError("ITEM_NOT_IN_INVENTORY", "Cet objet n'est pas dans l'inventaire.");
  if (quantity >= existing.quantity) return inventory.filter((entry) => entry.slug !== slug);
  return inventory.map((entry) =>
    entry.slug === slug ? { ...entry, quantity: entry.quantity - quantity } : entry,
  );
}

export function equipItem(
  inventory: InventoryEntry[],
  slug: string,
  isEquipped: boolean,
): InventoryEntry[] {
  if (!inventory.some((entry) => entry.slug === slug)) {
    throw new LifeRuleError("ITEM_NOT_IN_INVENTORY", "Cet objet n'est pas dans l'inventaire.");
  }
  return inventory.map((entry) => (entry.slug === slug ? { ...entry, isEquipped } : entry));
}
