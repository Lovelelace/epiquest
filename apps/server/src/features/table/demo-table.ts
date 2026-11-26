import { tableStateSchema, type GridPosition, type TableState } from "@epiquest/schemas";
import { DEMO_CAMPAIGN_ID } from "./campaign-membership.js";

/** Zone révélée au départ : l'entrée de la clairière, en haut à gauche. */
const INITIAL_REVEALED_COLUMNS = 5;
const INITIAL_REVEALED_ROWS = 4;

function revealedRectangle(columns: number, rows: number): GridPosition[] {
  return Array.from({ length: columns * rows }, (_, index) => ({
    column: index % columns,
    row: Math.floor(index / columns),
  }));
}

/**
 * Table de démonstration, en attendant l'éditeur de cartes.
 * Elle contient volontairement des informations cachées (jeton caché, créature dans le
 * brouillard, notes du MJ) pour montrer le filtrage de la vue joueurs.
 */
export function createDemoTableState(): TableState {
  return tableStateSchema.parse({
    campaignId: DEMO_CAMPAIGN_ID,
    revision: 0,
    map: { name: "Clairière des ruines", columns: 12, rows: 9 },
    tokens: [
      {
        id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e1",
        name: "Lyra",
        kind: "character",
        position: { column: 1, row: 1 },
        isVisibleToPlayers: true,
        hitPoints: { current: 12, maximum: 12 },
      },
      {
        id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e2",
        name: "Brann",
        kind: "character",
        position: { column: 2, row: 2 },
        isVisibleToPlayers: true,
        hitPoints: { current: 14, maximum: 14 },
      },
      {
        id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e3",
        name: "Gobelin éclaireur",
        kind: "creature",
        position: { column: 4, row: 2 },
        isVisibleToPlayers: true,
        hitPoints: { current: 7, maximum: 7 },
        gmNotes: "S'enfuit vers le nord dès qu'il passe sous 3 PV.",
      },
      {
        id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e4",
        name: "Chef gobelin",
        kind: "creature",
        position: { column: 9, row: 6 },
        isVisibleToPlayers: false,
        hitPoints: { current: 21, maximum: 21 },
        gmNotes: "Embusqué derrière les ruines, attaque au deuxième tour.",
      },
      {
        id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e5",
        name: "Loup",
        kind: "creature",
        position: { column: 7, row: 3 },
        isVisibleToPlayers: true,
        hitPoints: { current: 11, maximum: 11 },
      },
      {
        id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e6",
        name: "Coffre",
        kind: "object",
        position: { column: 3, row: 0 },
        isVisibleToPlayers: true,
        hitPoints: null,
        gmNotes: "Piégé : aiguille empoisonnée, DD 13 pour la repérer.",
      },
    ],
    revealedCells: revealedRectangle(INITIAL_REVEALED_COLUMNS, INITIAL_REVEALED_ROWS),
    rolls: [],
  });
}
