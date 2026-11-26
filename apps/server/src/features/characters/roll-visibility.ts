import type { CharacterRoll } from "@epiquest/schemas";

/** Destinataires possibles d'un jet. Le MJ arrivera avec les campagnes. */
export type RollViewer = "owner" | "game-master" | "other-player";

/**
 * Seule fonction qui décide ce qu'un destinataire voit d'un jet (SEC-09) :
 * - public : tout le monde voit tout ;
 * - privé : le joueur et le MJ voient tout, les autres joueurs ne le reçoivent pas ;
 * - caché : seul le MJ voit le résultat ; le joueur sait qu'un jet a eu lieu, sans dés ni total.
 * Renvoie `null` quand le jet ne doit pas être envoyé du tout.
 */
export function rollForViewer(roll: CharacterRoll, viewer: RollViewer): CharacterRoll | null {
  if (roll.visibility === "public" || viewer === "game-master") return roll;
  if (viewer === "other-player") return null;
  if (roll.visibility === "private") return roll;
  return { ...roll, dice: [], total: null };
}
