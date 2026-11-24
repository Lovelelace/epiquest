import { z } from "zod";

/**
 * Contrats temps réel de la table de jeu (synchronisation MJ / joueurs).
 *
 * Deux vues de la même table :
 * - `TableState` : l'état complet, envoyé uniquement à la salle du MJ ;
 * - `PlayerTableView` : la vue projetée pour les joueurs, sans aucun champ caché (SEC-08).
 *   Ses objets sont stricts : un champ en trop fait échouer la validation, ce qui permet aux
 *   tests de prouver qu'aucune donnée cachée ne s'y glisse (TEST-07).
 */

/** Taille maximale d'un côté de la grille, en cases. */
export const MAX_GRID_SIZE = 100;
/** Nombre de jets conservés dans l'historique de la table. */
export const MAX_ROLL_HISTORY = 50;
/** Nombre maximal de cases modifiées par une seule action de brouillard. */
export const MAX_FOG_CELLS_PER_ACTION = MAX_GRID_SIZE * MAX_GRID_SIZE;

const NAME_MAX_LENGTH = 120;
const NOTES_MAX_LENGTH = 2000;
const NOTATION_MAX_LENGTH = 60;

export const campaignIdSchema = z.uuid();
export const tokenIdSchema = z.uuid();

/** Public d'une salle : le MJ voit tout, les joueurs voient la vue projetée. */
export const tableAudienceSchema = z.enum(["gm", "players"]);

/** Case de la grille, comptée à partir de 0 en haut à gauche. */
export const gridPositionSchema = z.strictObject({
  column: z
    .int()
    .min(0)
    .max(MAX_GRID_SIZE - 1),
  row: z
    .int()
    .min(0)
    .max(MAX_GRID_SIZE - 1),
});

export const tableMapSchema = z.strictObject({
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  columns: z.int().min(1).max(MAX_GRID_SIZE),
  rows: z.int().min(1).max(MAX_GRID_SIZE),
});

/** `character` : personnage joueur ; `creature` : monstre ou PNJ ; `object` : élément de décor. */
export const tokenKindSchema = z.enum(["character", "creature", "object"]);

export const hitPointsSchema = z
  .strictObject({
    current: z.int().min(0),
    maximum: z.int().min(1),
  })
  .refine((hitPoints) => hitPoints.current <= hitPoints.maximum, {
    message: "Les PV actuels ne peuvent pas dépasser le maximum",
    path: ["current"],
  });

/** Jeton tel que le MJ le voit. Par défaut, un jeton est caché aux joueurs (SEC-10). */
export const tableTokenSchema = z.strictObject({
  id: tokenIdSchema,
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  kind: tokenKindSchema,
  position: gridPositionSchema,
  isVisibleToPlayers: z.boolean().default(false),
  hitPoints: hitPointsSchema.nullable(),
  gmNotes: z.string().max(NOTES_MAX_LENGTH).default(""),
});

/** `public` : visible de tous ; `gm` : jet secret du MJ, jamais envoyé aux joueurs. */
export const rollVisibilitySchema = z.enum(["public", "gm"]);

/** Résultat d'un jet, toujours tiré par le serveur (SEC-02). */
export const tableRollSchema = z.strictObject({
  id: z.uuid(),
  label: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  notation: z.string().trim().min(1).max(NOTATION_MAX_LENGTH),
  dice: z.array(z.int().min(1)),
  modifier: z.int(),
  total: z.int(),
  visibility: rollVisibilitySchema,
  rolledAt: z.iso.datetime(),
});

/** État complet de la table, réservé au MJ. `revision` augmente à chaque changement. */
export const tableStateSchema = z.strictObject({
  campaignId: campaignIdSchema,
  revision: z.int().min(0),
  map: tableMapSchema,
  tokens: z.array(tableTokenSchema),
  revealedCells: z.array(gridPositionSchema),
  rolls: z.array(tableRollSchema).max(MAX_ROLL_HISTORY),
});

/** État de santé approximatif d'une créature, montré aux joueurs à la place des PV. */
export const healthStatusSchema = z.enum(["unharmed", "wounded", "bloodied", "down"]);

/** Santé d'un jeton vue par les joueurs : exacte pour un personnage joueur, approximative sinon. */
export const playerTokenHealthSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("exact"), current: z.int().min(0), maximum: z.int().min(1) }),
  z.strictObject({ type: z.literal("approximate"), status: healthStatusSchema }),
]);

export const playerTokenSchema = z.strictObject({
  id: tokenIdSchema,
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  kind: tokenKindSchema,
  position: gridPositionSchema,
  health: playerTokenHealthSchema.nullable(),
});

/** Jet vu par les joueurs : seulement les jets publics, donc sans champ de visibilité. */
export const playerRollSchema = tableRollSchema.omit({ visibility: true });

/** Vue de la table envoyée à la salle des joueurs. */
export const playerTableViewSchema = z.strictObject({
  campaignId: campaignIdSchema,
  revision: z.int().min(0),
  map: tableMapSchema,
  tokens: z.array(playerTokenSchema),
  revealedCells: z.array(gridPositionSchema),
  rolls: z.array(playerRollSchema).max(MAX_ROLL_HISTORY),
});

/**
 * Identité transmise à la connexion Socket.IO (`auth` du handshake).
 * Provisoire : sera remplacée par la session de la feature comptes et campagnes.
 */
export const tableHandshakeSchema = z.strictObject({
  userId: z.string().trim().min(1).max(64),
});

/** Noms des événements Socket.IO de la table. */
export const TABLE_EVENTS = {
  join: "table:join",
  moveToken: "table:move-token",
  setFog: "table:set-fog",
  setTokenVisibility: "table:set-token-visibility",
  setHitPoints: "table:set-hit-points",
  roll: "table:roll",
  gmState: "table:state",
  playerView: "table:player-view",
} as const;

/** Client → serveur : rejoindre la salle d'une campagne pour un public. */
export const joinTableMessageSchema = z.strictObject({
  campaignId: campaignIdSchema,
  audience: tableAudienceSchema,
});

/** Client (MJ) → serveur : déplacer un jeton. */
export const moveTokenMessageSchema = z.strictObject({
  campaignId: campaignIdSchema,
  tokenId: tokenIdSchema,
  position: gridPositionSchema,
});

/** Client (MJ) → serveur : révéler ou recouvrir des cases. */
export const setFogMessageSchema = z.strictObject({
  campaignId: campaignIdSchema,
  cells: z.array(gridPositionSchema).min(1).max(MAX_FOG_CELLS_PER_ACTION),
  isRevealed: z.boolean(),
});

/** Client (MJ) → serveur : montrer ou cacher un jeton aux joueurs. */
export const setTokenVisibilityMessageSchema = z.strictObject({
  campaignId: campaignIdSchema,
  tokenId: tokenIdSchema,
  isVisibleToPlayers: z.boolean(),
});

/** Client (MJ) → serveur : fixer les PV actuels d'un jeton. Le maximum ne change pas ici. */
export const setHitPointsMessageSchema = z.strictObject({
  campaignId: campaignIdSchema,
  tokenId: tokenIdSchema,
  current: z.int().min(0),
});

/** Client (MJ) → serveur : demander un jet. Le client envoie une intention, pas un résultat (SEC-03). */
export const rollMessageSchema = z.strictObject({
  campaignId: campaignIdSchema,
  label: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  notation: z.string().trim().min(1).max(NOTATION_MAX_LENGTH),
  visibility: rollVisibilitySchema,
});

/** Codes d'erreur stables renvoyés par les événements de la table (CODE-16). */
export const tableErrorCodeSchema = z.enum([
  "INVALID_MESSAGE",
  "UNAUTHENTICATED",
  "NOT_A_MEMBER",
  "FORBIDDEN",
  "NOT_JOINED",
  "TOKEN_NOT_FOUND",
  "OUT_OF_MAP",
  "NO_HIT_POINTS",
  "HIT_POINTS_ABOVE_MAXIMUM",
  "INVALID_DICE_NOTATION",
]);

export const tableErrorSchema = z.strictObject({
  code: tableErrorCodeSchema,
  message: z.string().min(1),
});

/** Accusé de réception de chaque message client → serveur. */
export const tableAckSchema = z.discriminatedUnion("ok", [
  z.strictObject({ ok: z.literal(true) }),
  z.strictObject({ ok: z.literal(false), error: tableErrorSchema }),
]);

export type CampaignId = z.infer<typeof campaignIdSchema>;
export type TokenId = z.infer<typeof tokenIdSchema>;
export type TableAudience = z.infer<typeof tableAudienceSchema>;
export type GridPosition = z.infer<typeof gridPositionSchema>;
export type TableMap = z.infer<typeof tableMapSchema>;
export type TokenKind = z.infer<typeof tokenKindSchema>;
export type HitPoints = z.infer<typeof hitPointsSchema>;
export type TableToken = z.infer<typeof tableTokenSchema>;
export type RollVisibility = z.infer<typeof rollVisibilitySchema>;
export type TableRoll = z.infer<typeof tableRollSchema>;
export type TableState = z.infer<typeof tableStateSchema>;
export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type PlayerTokenHealth = z.infer<typeof playerTokenHealthSchema>;
export type PlayerToken = z.infer<typeof playerTokenSchema>;
export type PlayerRoll = z.infer<typeof playerRollSchema>;
export type PlayerTableView = z.infer<typeof playerTableViewSchema>;
export type TableHandshake = z.infer<typeof tableHandshakeSchema>;
export type JoinTableMessage = z.infer<typeof joinTableMessageSchema>;
export type MoveTokenMessage = z.infer<typeof moveTokenMessageSchema>;
export type SetFogMessage = z.infer<typeof setFogMessageSchema>;
export type SetTokenVisibilityMessage = z.infer<typeof setTokenVisibilityMessageSchema>;
export type SetHitPointsMessage = z.infer<typeof setHitPointsMessageSchema>;
export type RollMessage = z.infer<typeof rollMessageSchema>;
export type TableErrorCode = z.infer<typeof tableErrorCodeSchema>;
export type TableError = z.infer<typeof tableErrorSchema>;
export type TableAck = z.infer<typeof tableAckSchema>;
