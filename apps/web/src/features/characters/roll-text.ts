import type { CharacterRoll, RollVisibility } from "@epiquest/schemas";

export const VISIBILITY_LABELS: Record<RollVisibility, string> = {
  public: "Public",
  private: "Privé (vous et le MJ)",
  hidden: "Caché (le MJ seul voit le résultat)",
};

export function signed(value: number): string {
  return value >= 0 ? `+${value}` : `−${Math.abs(value)}`;
}

/** Phrase complète annoncée aux lecteurs d'écran et affichée après un jet. */
export function describeRoll(roll: CharacterRoll): string {
  if (roll.total === null) return `${roll.label} : jet caché lancé, seul le MJ voit le résultat.`;
  const dice = roll.dice.map((die) => `d${die.sides} ${die.value}`).join(", ");
  const modifier = roll.modifier === 0 ? "" : `, modificateur ${signed(roll.modifier)}`;
  return `${roll.label} : ${roll.total} (${dice}${modifier}).`;
}
