import { Module } from "@nestjs/common";
import { CAMPAIGN_MEMBERSHIP, DemoCampaignMembership } from "./campaign-membership.js";
import { createDemoTableState } from "./demo-table.js";
import { DICE_ROLLER, SimpleDiceRoller } from "./dice-roller.js";
import { TableGateway } from "./table.gateway.js";
import { InMemoryTableStateStore, TABLE_STATE_STORE } from "./table-state.store.js";

/**
 * Synchronisation MJ / joueurs. Les comptes, les cartes et l'évaluation des dés n'existent pas encore : leurs
 * interfaces sont fournies par des implémentations de démonstration (ARCH-16).
 */
@Module({
  providers: [
    TableGateway,
    { provide: CAMPAIGN_MEMBERSHIP, useClass: DemoCampaignMembership },
    { provide: DICE_ROLLER, useFactory: () => new SimpleDiceRoller() },
    {
      provide: TABLE_STATE_STORE,
      useFactory: () => new InMemoryTableStateStore([createDemoTableState()]),
    },
  ],
})
export class TableModule {}
