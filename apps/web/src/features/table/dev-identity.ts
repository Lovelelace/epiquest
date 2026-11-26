import { DEMO_GAME_MASTER_ID } from "./demo";

/** Paramètre d'URL qui choisit l'utilisateur de démonstration (`?utilisateur=demo-player-1`). */
export const DEV_IDENTITY_PARAM = "utilisateur";

/**
 * Identité provisoire, en attendant les comptes (feature 3) : elle est lue dans l'URL et envoyée
 * telle quelle au serveur. Elle n'a aucune valeur de sécurité.
 */
export function devIdentityFrom(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const value = searchParams[DEV_IDENTITY_PARAM];
  const userId = Array.isArray(value) ? value[0] : value;
  return userId !== undefined && userId.trim() !== "" ? userId : DEMO_GAME_MASTER_ID;
}
