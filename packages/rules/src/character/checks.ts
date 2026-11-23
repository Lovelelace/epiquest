import type { RollDie } from "./ability-rolls.js";

export const D20_SIDES = 20;

export interface RolledDie {
  sides: number;
  value: number;
}

export interface RollResult {
  expression: string;
  dice: RolledDie[];
  modifier: number;
  total: number;
}

function formatModifier(modifier: number): string {
  if (modifier === 0) return "";
  return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
}

function rollMany(rollDie: RollDie, count: number, sides: number): RolledDie[] {
  return Array.from({ length: count }, () => {
    const value = rollDie(sides);
    if (!Number.isInteger(value) || value < 1 || value > sides) {
      throw new RangeError(`Dé invalide : ${value} (attendu : entier de 1 à ${sides})`);
    }
    return { sides, value };
  });
}

/** Jet de d20 plus un modificateur : test de caractéristique, sauvegarde, compétence, attaque. */
export function rollCheck(rollDie: RollDie, modifier: number): RollResult {
  const dice = rollMany(rollDie, 1, D20_SIDES);
  return {
    expression: `1d20${formatModifier(modifier)}`,
    dice,
    modifier,
    total: (dice[0]?.value ?? 0) + modifier,
  };
}

const DICE_GROUP = /^(\d+)d(\d+)$/;

// TODO(#26): utiliser l'évaluation du moteur de dés pour toute la notation.
/** Jet de dégâts : un groupe de dés du SRD (« 1d8 ») plus un modificateur, au minimum 0. */
export function rollDamage(rollDie: RollDie, damageDice: string, modifier: number): RollResult {
  const match = DICE_GROUP.exec(damageDice.trim());
  if (!match) throw new RangeError(`Dés de dégâts non pris en charge : « ${damageDice} »`);
  const dice = rollMany(rollDie, Number(match[1]), Number(match[2]));
  const sum = dice.reduce((total, die) => total + die.value, 0);
  return {
    expression: `${damageDice}${formatModifier(modifier)}`,
    dice,
    modifier,
    total: Math.max(0, sum + modifier),
  };
}
