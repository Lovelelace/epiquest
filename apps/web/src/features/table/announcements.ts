import type { PlayerTableView } from "@epiquest/schemas";
import { describeHealth, describePosition } from "./labels";

/**
 * Phrases à annoncer aux lecteurs d'écran quand la vue joueurs change (A11Y-10).
 * Fonction pure : compare deux vues successives, sans rien savoir du réseau.
 */
export function describeChanges(previous: PlayerTableView | null, next: PlayerTableView): string[] {
  if (previous === null) {
    return [`Table « ${next.map.name} » chargée : ${next.tokens.length} jetons visibles.`];
  }
  return [
    ...describeTokenChanges(previous, next),
    ...describeNewRolls(previous, next),
    ...describeFog(previous, next),
  ];
}

function describeTokenChanges(previous: PlayerTableView, next: PlayerTableView): string[] {
  const before = new Map(previous.tokens.map((token) => [token.id, token]));
  const after = new Set(next.tokens.map((token) => token.id));
  const messages: string[] = [];

  for (const token of next.tokens) {
    const old = before.get(token.id);
    if (old === undefined) {
      messages.push(`${token.name} apparaît en ${describePosition(token.position)}.`);
      continue;
    }
    if (old.position.column !== token.position.column || old.position.row !== token.position.row) {
      messages.push(`${token.name} se déplace en ${describePosition(token.position)}.`);
    }
    if (describeHealth(old.health) !== describeHealth(token.health)) {
      messages.push(`${token.name} : ${describeHealth(token.health)}.`);
    }
  }
  for (const token of previous.tokens) {
    if (!after.has(token.id)) messages.push(`${token.name} n'est plus visible.`);
  }
  return messages;
}

function describeNewRolls(previous: PlayerTableView, next: PlayerTableView): string[] {
  const known = new Set(previous.rolls.map((roll) => roll.id));
  return next.rolls
    .filter((roll) => !known.has(roll.id))
    .map((roll) => `Jet « ${roll.label} » (${roll.notation}) : ${roll.total}.`);
}

function describeFog(previous: PlayerTableView, next: PlayerTableView): string[] {
  const difference = next.revealedCells.length - previous.revealedCells.length;
  if (difference > 0) return [`${difference} cases révélées.`];
  if (difference < 0) return [`${-difference} cases recouvertes par le brouillard.`];
  return [];
}
