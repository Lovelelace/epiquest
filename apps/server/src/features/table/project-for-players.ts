import type {
  GridPosition,
  HealthStatus,
  HitPoints,
  PlayerRoll,
  PlayerTableView,
  PlayerToken,
  PlayerTokenHealth,
  TableRoll,
  TableState,
  TableToken,
} from "@epiquest/schemas";

/** Une créature est « en sang » à la moitié de ses PV maximum ou moins (convention 5e). */
const BLOODIED_RATIO = 0.5;

/**
 * Seule fonction qui construit ce que les joueurs voient de la table (SEC-09).
 *
 * Tout est caché par défaut (SEC-10) : chaque champ envoyé est recopié explicitement, jamais
 * par décomposition de l'objet du MJ. Sont retirés :
 * - les jetons marqués cachés ;
 * - les créatures et objets placés dans une case non révélée (les personnages joueurs restent
 *   visibles : le groupe sait où il se trouve) ;
 * - les notes du MJ, les PV exacts des créatures (remplacés par un état approximatif) ;
 * - les jets secrets du MJ.
 */
export function projectForPlayers(state: TableState): PlayerTableView {
  const revealed = new Set(state.revealedCells.map(cellKey));
  return {
    campaignId: state.campaignId,
    revision: state.revision,
    map: { name: state.map.name, columns: state.map.columns, rows: state.map.rows },
    tokens: state.tokens
      .filter((token) => isTokenVisibleToPlayers(token, revealed))
      .map(projectToken),
    revealedCells: state.revealedCells.map(copyPosition),
    rolls: state.rolls.filter((roll) => roll.visibility === "public").map(projectRoll),
  };
}

/** État de santé approximatif : ce qu'un personnage peut deviner en regardant la créature. */
export function healthStatusOf(hitPoints: HitPoints): HealthStatus {
  if (hitPoints.current === 0) return "down";
  if (hitPoints.current >= hitPoints.maximum) return "unharmed";
  if (hitPoints.current <= hitPoints.maximum * BLOODIED_RATIO) return "bloodied";
  return "wounded";
}

function isTokenVisibleToPlayers(token: TableToken, revealed: ReadonlySet<string>): boolean {
  if (!token.isVisibleToPlayers) return false;
  return token.kind === "character" || revealed.has(cellKey(token.position));
}

function projectToken(token: TableToken): PlayerToken {
  return {
    id: token.id,
    name: token.name,
    kind: token.kind,
    position: copyPosition(token.position),
    health: projectHealth(token),
  };
}

function projectHealth(token: TableToken): PlayerTokenHealth | null {
  if (token.hitPoints === null) return null;
  if (token.kind === "character") {
    return { type: "exact", current: token.hitPoints.current, maximum: token.hitPoints.maximum };
  }
  return { type: "approximate", status: healthStatusOf(token.hitPoints) };
}

function projectRoll(roll: TableRoll): PlayerRoll {
  return {
    id: roll.id,
    label: roll.label,
    notation: roll.notation,
    dice: [...roll.dice],
    modifier: roll.modifier,
    total: roll.total,
    rolledAt: roll.rolledAt,
  };
}

function copyPosition(position: GridPosition): GridPosition {
  return { column: position.column, row: position.row };
}

function cellKey(position: GridPosition): string {
  return `${position.column}:${position.row}`;
}
