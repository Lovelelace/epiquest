import type { CampaignId } from "@epiquest/schemas";

/** Rôle d'un utilisateur dans une campagne. */
export type CampaignRole = "gm" | "player";

/**
 * Interface fournie par la feature comptes et campagnes (ARCH-14, ARCH-16).
 * La table ne lit jamais les tables de cette feature : elle lui demande seulement un rôle.
 */
export interface CampaignMembership {
  /** Rôle de l'utilisateur dans la campagne, ou `null` s'il n'en fait pas partie. */
  roleOf(userId: string, campaignId: CampaignId): CampaignRole | null;
}

export const CAMPAIGN_MEMBERSHIP = Symbol("CAMPAIGN_MEMBERSHIP");

/** Campagne de démonstration chargée tant que les campagnes n'existent pas. */
export const DEMO_CAMPAIGN_ID = "5e0c4a3b-2d1f-4e6a-9b8c-7d6e5f4a3b2c";

/** Utilisateurs de démonstration : un MJ et deux joueurs. */
export const DEMO_USERS = {
  gameMaster: "demo-gm",
  firstPlayer: "demo-player-1",
  secondPlayer: "demo-player-2",
} as const;

/**
 * Annuaire de démonstration en mémoire.
 * TODO(#50): remplacer par le service de la feature comptes et campagnes quand elle existera.
 */
export class DemoCampaignMembership implements CampaignMembership {
  private readonly roles = new Map<string, CampaignRole>([
    [membershipKey(DEMO_USERS.gameMaster, DEMO_CAMPAIGN_ID), "gm"],
    [membershipKey(DEMO_USERS.firstPlayer, DEMO_CAMPAIGN_ID), "player"],
    [membershipKey(DEMO_USERS.secondPlayer, DEMO_CAMPAIGN_ID), "player"],
  ]);

  roleOf(userId: string, campaignId: CampaignId): CampaignRole | null {
    return this.roles.get(membershipKey(userId, campaignId)) ?? null;
  }
}

function membershipKey(userId: string, campaignId: CampaignId): string {
  return `${campaignId}/${userId}`;
}
