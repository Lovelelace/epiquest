import type { PlayerTableView, TableState } from "@epiquest/schemas";

/** États de table utilisés par les tests de composants. */
export const CAMPAIGN_ID = "5e0c4a3b-2d1f-4e6a-9b8c-7d6e5f4a3b2c";

export const playerView: PlayerTableView = {
  campaignId: CAMPAIGN_ID,
  revision: 3,
  map: { name: "Clairière des ruines", columns: 4, rows: 3 },
  tokens: [
    {
      id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e1",
      name: "Lyra",
      kind: "character",
      position: { column: 0, row: 0 },
      health: { type: "exact", current: 9, maximum: 12 },
    },
    {
      id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e3",
      name: "Gobelin éclaireur",
      kind: "creature",
      position: { column: 1, row: 1 },
      health: { type: "approximate", status: "bloodied" },
    },
  ],
  revealedCells: [
    { column: 0, row: 0 },
    { column: 1, row: 0 },
    { column: 0, row: 1 },
    { column: 1, row: 1 },
  ],
  rolls: [
    {
      id: "d4d4d4d4-0000-4000-8000-000000000001",
      label: "Attaque de Lyra",
      notation: "1d20+5",
      dice: [14],
      modifier: 5,
      total: 19,
      rolledAt: "2026-11-24T12:00:00.000Z",
    },
  ],
};

export const gmState: TableState = {
  campaignId: CAMPAIGN_ID,
  revision: 3,
  map: playerView.map,
  tokens: [
    {
      id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e1",
      name: "Lyra",
      kind: "character",
      position: { column: 0, row: 0 },
      isVisibleToPlayers: true,
      hitPoints: { current: 9, maximum: 12 },
      gmNotes: "",
    },
    {
      id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e4",
      name: "Chef gobelin",
      kind: "creature",
      position: { column: 3, row: 2 },
      isVisibleToPlayers: false,
      hitPoints: { current: 21, maximum: 21 },
      gmNotes: "Embusqué derrière les ruines.",
    },
  ],
  revealedCells: playerView.revealedCells,
  rolls: [
    { ...playerView.rolls[0]!, visibility: "public" },
    {
      id: "d4d4d4d4-0000-4000-8000-000000000002",
      label: "Discrétion du chef",
      notation: "1d20+6",
      dice: [17],
      modifier: 6,
      total: 23,
      visibility: "gm",
      rolledAt: "2026-11-24T12:00:05.000Z",
    },
  ],
};
