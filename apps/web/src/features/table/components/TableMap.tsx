import type { GridPosition, TableMap as TableMapData, TokenKind } from "@epiquest/schemas";
import { tokenInitials } from "../labels";

export interface MapToken {
  id: string;
  name: string;
  kind: TokenKind;
  position: GridPosition;
  /** Vue MJ seulement : le jeton n'est pas montré aux joueurs. */
  isHiddenFromPlayers?: boolean;
}

/** Forme et couleur par type : la forme suffit à les distinguer sans la couleur (A11Y-13). */
const TOKEN_STYLES: Record<TokenKind, string> = {
  character: "rounded-full bg-sky-200 border-sky-900",
  creature: "rounded-none bg-rose-200 border-rose-900",
  object: "rounded-md bg-amber-100 border-amber-900 border-dashed",
};

/**
 * Carte en grille, purement visuelle. Son équivalent textuel est le tableau des jetons
 * (A11Y-11) : la grille est donc masquée aux technologies d'assistance.
 * `fog` : `opaque` pour les joueurs (cases non révélées noires), `translucent` pour le MJ.
 */
export function TableMap({
  map,
  revealedCells,
  tokens,
  fog,
  selectedTokenId = null,
  onCellActivate,
}: {
  map: TableMapData;
  revealedCells: readonly GridPosition[];
  tokens: readonly MapToken[];
  fog: "opaque" | "translucent";
  selectedTokenId?: string | null;
  /** Raccourci à la souris (vue MJ). Toujours doublé d'une commande au clavier (A11Y-05). */
  onCellActivate?: (cell: GridPosition, isRevealed: boolean) => void;
}) {
  const revealed = new Set(revealedCells.map(cellKey));
  const tokensByCell = new Map<string, MapToken[]>();
  for (const token of tokens) {
    const key = cellKey(token.position);
    tokensByCell.set(key, [...(tokensByCell.get(key) ?? []), token]);
  }
  const cells = Array.from({ length: map.columns * map.rows }, (_, index) => ({
    column: index % map.columns,
    row: Math.floor(index / map.columns),
  }));

  return (
    <figure className="w-full">
      <div
        aria-hidden="true"
        className="grid w-full max-w-3xl border border-slate-700"
        style={{ gridTemplateColumns: `repeat(${map.columns}, minmax(0, 1fr))` }}
      >
        {cells.map((cell) => {
          const key = cellKey(cell);
          const isRevealed = revealed.has(key);
          return (
            <div
              key={key}
              data-testid={`cell-${key}`}
              data-revealed={isRevealed}
              onClick={
                onCellActivate === undefined ? undefined : () => onCellActivate(cell, isRevealed)
              }
              className={`relative flex aspect-square items-center justify-center border border-slate-300 ${fogClass(isRevealed, fog)} ${onCellActivate === undefined ? "" : "cursor-pointer"}`}
            >
              {(tokensByCell.get(key) ?? []).map((token) => (
                <span
                  key={token.id}
                  title={token.name}
                  className={`flex h-4/5 w-4/5 items-center justify-center border-2 text-xs font-bold text-slate-900 ${TOKEN_STYLES[token.kind]} ${token.isHiddenFromPlayers === true ? "opacity-60 outline-2 outline-dotted outline-slate-900" : ""} ${token.id === selectedTokenId ? "ring-4 ring-violet-700" : ""}`}
                >
                  {tokenInitials(token.name)}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <figcaption className="mt-2 text-sm text-slate-700">
        Carte « {map.name} », {map.columns} colonnes sur {map.rows} lignes. Le tableau des jetons
        ci-dessous en donne le détail.
      </figcaption>
    </figure>
  );
}

function fogClass(isRevealed: boolean, fog: "opaque" | "translucent"): string {
  if (isRevealed) return "bg-emerald-50";
  return fog === "opaque"
    ? "bg-slate-800"
    : "bg-slate-300 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(15,23,42,0.15)_4px,rgba(15,23,42,0.15)_8px)]";
}

function cellKey(position: GridPosition): string {
  return `${position.column}-${position.row}`;
}
