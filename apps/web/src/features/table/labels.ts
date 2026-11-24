import type { HealthStatus, PlayerTokenHealth, TokenKind } from "@epiquest/schemas";

/** Libellés français de la table (CODE-08 : en attendant un système de traduction). */
export const TOKEN_KIND_LABELS: Record<TokenKind, string> = {
  character: "Personnage",
  creature: "Créature",
  object: "Objet",
};

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  unharmed: "Indemne",
  wounded: "Blessé",
  bloodied: "En sang",
  down: "À terre",
};

/** Position lisible par un humain : colonnes et lignes comptées à partir de 1. */
export function describePosition(position: { column: number; row: number }): string {
  return `colonne ${position.column + 1}, ligne ${position.row + 1}`;
}

export function describeHealth(health: PlayerTokenHealth | null): string {
  if (health === null) return "—";
  if (health.type === "exact") return `${health.current} / ${health.maximum} PV`;
  return HEALTH_STATUS_LABELS[health.status];
}

/** Initiales affichées sur un jeton de la carte. */
export function tokenInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
