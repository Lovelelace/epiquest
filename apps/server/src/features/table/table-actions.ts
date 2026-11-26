import {
  MAX_ROLL_HISTORY,
  type GridPosition,
  type TableErrorCode,
  type TableRoll,
  type TableState,
  type TableToken,
} from "@epiquest/schemas";

/** Résultat d'une action : le nouvel état, ou un code d'erreur stable (CODE-16). */
export type ActionResult = { ok: true; state: TableState } | { ok: false; code: TableErrorCode };

/*
 * Actions du MJ sur la table, en fonctions pures (ARCH-08) : elles ne modifient jamais l'état
 * reçu et renvoient un nouvel état dont la révision a augmenté d'une unité.
 */

export function moveToken(
  state: TableState,
  tokenId: string,
  position: GridPosition,
): ActionResult {
  if (!isInsideMap(state, position)) return { ok: false, code: "OUT_OF_MAP" };
  return updateToken(state, tokenId, (token) => ({ ok: true, token: { ...token, position } }));
}

export function setTokenVisibility(
  state: TableState,
  tokenId: string,
  isVisibleToPlayers: boolean,
): ActionResult {
  return updateToken(state, tokenId, (token) => ({
    ok: true,
    token: { ...token, isVisibleToPlayers },
  }));
}

export function setHitPoints(state: TableState, tokenId: string, current: number): ActionResult {
  return updateToken(state, tokenId, (token) => {
    if (token.hitPoints === null) return { ok: false, code: "NO_HIT_POINTS" };
    if (current > token.hitPoints.maximum) return { ok: false, code: "HIT_POINTS_ABOVE_MAXIMUM" };
    return { ok: true, token: { ...token, hitPoints: { ...token.hitPoints, current } } };
  });
}

/** Révèle (`isRevealed`) ou recouvre des cases. Les doublons sont ignorés. */
export function setFog(
  state: TableState,
  cells: readonly GridPosition[],
  isRevealed: boolean,
): ActionResult {
  if (!cells.every((cell) => isInsideMap(state, cell))) return { ok: false, code: "OUT_OF_MAP" };
  const changed = new Set(cells.map(cellKey));
  const kept = state.revealedCells.filter((cell) => !changed.has(cellKey(cell)));
  const revealedCells = isRevealed ? [...kept, ...uniqueCells(cells)] : kept;
  return { ok: true, state: nextRevision(state, { revealedCells }) };
}

/** Ajoute un jet à l'historique, en ne gardant que les `MAX_ROLL_HISTORY` plus récents. */
export function appendRoll(state: TableState, roll: TableRoll): ActionResult {
  const rolls = [...state.rolls, roll].slice(-MAX_ROLL_HISTORY);
  return { ok: true, state: nextRevision(state, { rolls }) };
}

type TokenUpdate = { ok: true; token: TableToken } | { ok: false; code: TableErrorCode };

function updateToken(
  state: TableState,
  tokenId: string,
  update: (token: TableToken) => TokenUpdate,
): ActionResult {
  const token = state.tokens.find((candidate) => candidate.id === tokenId);
  if (token === undefined) return { ok: false, code: "TOKEN_NOT_FOUND" };
  const result = update(token);
  if (!result.ok) return result;
  const tokens = state.tokens.map((candidate) =>
    candidate.id === tokenId ? result.token : candidate,
  );
  return { ok: true, state: nextRevision(state, { tokens }) };
}

function nextRevision(state: TableState, changes: Partial<TableState>): TableState {
  return { ...state, ...changes, revision: state.revision + 1 };
}

function isInsideMap(state: TableState, position: GridPosition): boolean {
  return position.column < state.map.columns && position.row < state.map.rows;
}

function uniqueCells(cells: readonly GridPosition[]): GridPosition[] {
  const seen = new Map(cells.map((cell) => [cellKey(cell), cell]));
  return [...seen.values()];
}

function cellKey(position: GridPosition): string {
  return `${position.column}:${position.row}`;
}
