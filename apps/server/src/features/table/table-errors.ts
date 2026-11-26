import type { TableAck, TableErrorCode } from "@epiquest/schemas";

/** Messages compréhensibles par un non-développeur (CODE-17), un par code stable. */
const MESSAGES: Record<TableErrorCode, string> = {
  INVALID_MESSAGE: "La demande est mal formée.",
  UNAUTHENTICATED: "Vous devez être identifié pour rejoindre une table.",
  NOT_A_MEMBER: "Vous ne faites pas partie de cette campagne.",
  FORBIDDEN: "Cette action est réservée au MJ.",
  NOT_JOINED: "Rejoignez d'abord la table de cette campagne.",
  TOKEN_NOT_FOUND: "Ce jeton n'existe pas sur la table.",
  OUT_OF_MAP: "Cette case est en dehors de la carte.",
  NO_HIT_POINTS: "Ce jeton n'a pas de points de vie.",
  HIT_POINTS_ABOVE_MAXIMUM: "Les points de vie ne peuvent pas dépasser le maximum du jeton.",
  INVALID_DICE_NOTATION: "Cette notation de dés n'est pas reconnue.",
};

export function tableError(code: TableErrorCode): TableAck {
  return { ok: false, error: { code, message: MESSAGES[code] } };
}

export const TABLE_OK: TableAck = { ok: true };
