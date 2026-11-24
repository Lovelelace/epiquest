import type { CampaignId, TableState } from "@epiquest/schemas";

/**
 * Accès à l'état de la table d'une campagne. Interface fournie à terme par la feature cartes
 * et brouillard (ARCH-14, ARCH-16) ; la synchronisation ne connaît que cette interface.
 */
export interface TableStateStore {
  get(campaignId: CampaignId): TableState | undefined;
  save(state: TableState): void;
}

export const TABLE_STATE_STORE = Symbol("TABLE_STATE_STORE");

/**
 * Magasin en mémoire : l'état est perdu au redémarrage du serveur.
 * TODO(#50): remplacer par le stockage de la feature cartes et brouillard.
 */
export class InMemoryTableStateStore implements TableStateStore {
  private readonly states = new Map<CampaignId, TableState>();

  constructor(initialStates: readonly TableState[] = []) {
    for (const state of initialStates) this.save(state);
  }

  get(campaignId: CampaignId): TableState | undefined {
    return this.states.get(campaignId);
  }

  save(state: TableState): void {
    this.states.set(state.campaignId, state);
  }
}
