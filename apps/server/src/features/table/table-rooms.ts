import type { CampaignId, TableAudience } from "@epiquest/schemas";

/** Nom de la salle Socket.IO d'une campagne pour un public : `campaign:<id>:gm` ou `:players`. */
export function tableRoom(campaignId: CampaignId, audience: TableAudience): string {
  return `campaign:${campaignId}:${audience}`;
}
