import { describe, expect, it } from "vitest";
import {
  joinTableMessageSchema,
  playerTableViewSchema,
  rollMessageSchema,
  setFogMessageSchema,
  tableAckSchema,
  tableStateSchema,
  tableTokenSchema,
} from "./table.js";

const CAMPAIGN_ID = "6f1c1b7e-3c1a-4d55-9f0e-1a2b3c4d5e6f";
const GOBLIN_ID = "0b6f3f9c-8f7e-4a0f-b7f1-2d3c4b5a6978";

const goblin = {
  id: GOBLIN_ID,
  name: "Gobelin",
  kind: "creature",
  position: { column: 2, row: 3 },
  isVisibleToPlayers: true,
  hitPoints: { current: 4, maximum: 7 },
  gmNotes: "Fuit à 2 PV",
};

const state = {
  campaignId: CAMPAIGN_ID,
  revision: 0,
  map: { name: "Clairière", columns: 10, rows: 8 },
  tokens: [goblin],
  revealedCells: [{ column: 2, row: 3 }],
  rolls: [],
};

describe("tableTokenSchema", () => {
  it("cache un jeton aux joueurs quand la visibilité n'est pas précisée", () => {
    const withoutVisibility: Record<string, unknown> = { ...goblin };
    delete withoutVisibility.isVisibleToPlayers;
    expect(tableTokenSchema.parse(withoutVisibility).isVisibleToPlayers).toBe(false);
  });

  it("refuse des PV actuels supérieurs au maximum", () => {
    const result = tableTokenSchema.safeParse({ ...goblin, hitPoints: { current: 9, maximum: 7 } });
    expect(result.success).toBe(false);
  });
});

describe("tableStateSchema", () => {
  it("accepte un état complet valide", () => {
    expect(tableStateSchema.parse(state)).toEqual(state);
  });

  it("refuse une case hors des limites de la grille", () => {
    const result = tableStateSchema.safeParse({
      ...state,
      revealedCells: [{ column: -1, row: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("playerTableViewSchema", () => {
  const view = {
    campaignId: CAMPAIGN_ID,
    revision: 0,
    map: state.map,
    tokens: [
      {
        id: GOBLIN_ID,
        name: "Gobelin",
        kind: "creature",
        position: { column: 2, row: 3 },
        health: { type: "approximate", status: "wounded" },
      },
    ],
    revealedCells: state.revealedCells,
    rolls: [],
  };

  it("accepte une vue joueurs valide", () => {
    expect(playerTableViewSchema.parse(view)).toEqual(view);
  });

  it("refuse un jeton qui porte des notes du MJ", () => {
    const leaked = { ...view, tokens: [{ ...view.tokens[0], gmNotes: "Fuit à 2 PV" }] };
    expect(playerTableViewSchema.safeParse(leaked).success).toBe(false);
  });

  it("refuse un jet qui porte une visibilité", () => {
    const leaked = {
      ...view,
      rolls: [
        {
          id: "9d4c2a1b-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
          label: "Perception",
          notation: "1d20+2",
          dice: [12],
          modifier: 2,
          total: 14,
          visibility: "gm",
          rolledAt: "2026-11-24T12:00:00.000Z",
        },
      ],
    };
    expect(playerTableViewSchema.safeParse(leaked).success).toBe(false);
  });
});

describe("messages client → serveur", () => {
  it("accepte une demande d'entrée dans la salle des joueurs", () => {
    const message = { campaignId: CAMPAIGN_ID, audience: "players" };
    expect(joinTableMessageSchema.parse(message)).toEqual(message);
  });

  it("refuse un public inconnu", () => {
    const result = joinTableMessageSchema.safeParse({ campaignId: CAMPAIGN_ID, audience: "all" });
    expect(result.success).toBe(false);
  });

  it("refuse une action de brouillard sans case", () => {
    const result = setFogMessageSchema.safeParse({
      campaignId: CAMPAIGN_ID,
      cells: [],
      isRevealed: true,
    });
    expect(result.success).toBe(false);
  });

  it("refuse un jet qui transmet un résultat calculé par le client", () => {
    const result = rollMessageSchema.safeParse({
      campaignId: CAMPAIGN_ID,
      label: "Attaque",
      notation: "1d20+5",
      visibility: "public",
      total: 25,
    });
    expect(result.success).toBe(false);
  });
});

describe("tableAckSchema", () => {
  it("accepte un refus avec un code stable", () => {
    const ack = { ok: false, error: { code: "FORBIDDEN", message: "Réservé au MJ." } };
    expect(tableAckSchema.parse(ack)).toEqual(ack);
  });

  it("refuse un code d'erreur inconnu", () => {
    const result = tableAckSchema.safeParse({
      ok: false,
      error: { code: "OOPS", message: "Erreur" },
    });
    expect(result.success).toBe(false);
  });
});
