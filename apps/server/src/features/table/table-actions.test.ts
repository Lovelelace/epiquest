import { MAX_ROLL_HISTORY, type TableRoll } from "@epiquest/schemas";
import { describe, expect, it } from "vitest";
import { createDemoTableState } from "./demo-table.js";
import {
  appendRoll,
  moveToken,
  setFog,
  setHitPoints,
  setTokenVisibility,
} from "./table-actions.js";

const state = createDemoTableState();
const goblin = state.tokens.find((token) => token.name === "Gobelin éclaireur")!;
const chest = state.tokens.find((token) => token.kind === "object")!;
const MISSING_ID = "99999999-9999-4999-8999-999999999999";

function successState(result: ReturnType<typeof moveToken>) {
  if (!result.ok) throw new Error(`Action refusée : ${result.code}`);
  return result.state;
}

const roll = (index: number): TableRoll => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  label: `Jet ${index}`,
  notation: "1d20",
  dice: [10],
  modifier: 0,
  total: 10,
  visibility: "public",
  rolledAt: "2026-11-24T12:00:00.000Z",
});

describe("moveToken", () => {
  it("déplace le jeton et augmente la révision", () => {
    const next = successState(moveToken(state, goblin.id, { column: 5, row: 5 }));
    expect(next.tokens.find((token) => token.id === goblin.id)?.position).toEqual({
      column: 5,
      row: 5,
    });
    expect(next.revision).toBe(state.revision + 1);
  });

  it("ne modifie pas l'état reçu", () => {
    moveToken(state, goblin.id, { column: 5, row: 5 });
    expect(state.tokens.find((token) => token.id === goblin.id)?.position).toEqual({
      column: 4,
      row: 2,
    });
  });

  it("refuse une case hors de la carte", () => {
    expect(moveToken(state, goblin.id, { column: state.map.columns, row: 0 })).toEqual({
      ok: false,
      code: "OUT_OF_MAP",
    });
  });

  it("refuse un jeton inconnu", () => {
    expect(moveToken(state, MISSING_ID, { column: 0, row: 0 })).toEqual({
      ok: false,
      code: "TOKEN_NOT_FOUND",
    });
  });
});

describe("setTokenVisibility", () => {
  it("cache un jeton aux joueurs", () => {
    const next = successState(setTokenVisibility(state, goblin.id, false));
    expect(next.tokens.find((token) => token.id === goblin.id)?.isVisibleToPlayers).toBe(false);
  });
});

describe("setHitPoints", () => {
  it("fixe les PV actuels", () => {
    const next = successState(setHitPoints(state, goblin.id, 2));
    expect(next.tokens.find((token) => token.id === goblin.id)?.hitPoints).toEqual({
      current: 2,
      maximum: 7,
    });
  });

  it("refuse des PV au-dessus du maximum au lieu de les corriger", () => {
    expect(setHitPoints(state, goblin.id, 8)).toEqual({
      ok: false,
      code: "HIT_POINTS_ABOVE_MAXIMUM",
    });
  });

  it("refuse un jeton sans PV", () => {
    expect(setHitPoints(state, chest.id, 1)).toEqual({ ok: false, code: "NO_HIT_POINTS" });
  });
});

describe("setFog", () => {
  it("révèle des cases sans créer de doublon", () => {
    const cells = [
      { column: 10, row: 8 },
      { column: 10, row: 8 },
      { column: 0, row: 0 },
    ];
    const next = successState(setFog(state, cells, true));
    expect(next.revealedCells).toHaveLength(state.revealedCells.length + 1);
  });

  it("recouvre des cases", () => {
    const next = successState(setFog(state, [{ column: 0, row: 0 }], false));
    expect(next.revealedCells).not.toContainEqual({ column: 0, row: 0 });
    expect(next.revealedCells).toHaveLength(state.revealedCells.length - 1);
  });

  it("refuse toute l'action si une case sort de la carte", () => {
    expect(
      setFog(
        state,
        [
          { column: 0, row: 0 },
          { column: 0, row: state.map.rows },
        ],
        true,
      ),
    ).toEqual({
      ok: false,
      code: "OUT_OF_MAP",
    });
  });
});

describe("appendRoll", () => {
  it(`ne garde que les ${MAX_ROLL_HISTORY} jets les plus récents`, () => {
    let current = state;
    for (let index = 0; index <= MAX_ROLL_HISTORY; index++)
      current = successState(appendRoll(current, roll(index)));
    expect(current.rolls).toHaveLength(MAX_ROLL_HISTORY);
    expect(current.rolls[0]?.label).toBe("Jet 1");
    expect(current.rolls.at(-1)?.label).toBe(`Jet ${MAX_ROLL_HISTORY}`);
  });
});
