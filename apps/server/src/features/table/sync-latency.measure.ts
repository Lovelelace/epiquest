import { TABLE_EVENTS, type TableState } from "@epiquest/schemas";
import { cpus, platform, release } from "node:os";
import { performance } from "node:perf_hooks";
import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEMO_CAMPAIGN_ID, DEMO_USERS } from "./campaign-membership.js";
import { createDemoTableState } from "./demo-table.js";
import { projectForPlayers } from "./project-for-players.js";
import {
  emitWithAck,
  nextGmState,
  nextPlayerView,
  playerViewAtRevision,
  startTableTestApp,
  type TableTestApp,
} from "./table.test-helpers.js";

/*
 * Mesure du délai de synchronisation MJ → joueurs (CODE-25, issue #56).
 * Paramètres (variables d'environnement) : SYNC_PLAYERS, SYNC_ITERATIONS, SYNC_WARMUP.
 * Résultats et méthode : docs/mesures/synchronisation.md.
 */
const PLAYERS = Number(process.env.SYNC_PLAYERS ?? 6);
const ITERATIONS = Number(process.env.SYNC_ITERATIONS ?? 500);
const WARMUP = Number(process.env.SYNC_WARMUP ?? 50);
const PROJECTION_ITERATIONS = 2000;
const LARGE_MAP_SIZE = 100;
const LARGE_TOKEN_COUNT = 200;

interface Summary {
  median: number;
  p95: number;
  max: number;
}

function summarize(samples: readonly number[]): Summary {
  const sorted = [...samples].sort((a, b) => a - b);
  const at = (ratio: number): number =>
    sorted[Math.min(sorted.length - 1, Math.floor(ratio * sorted.length))] ?? 0;
  return { median: at(0.5), p95: at(0.95), max: sorted.at(-1) ?? 0 };
}

function format(summary: Summary, unit: string, digits = 2): string {
  return `médiane ${summary.median.toFixed(digits)} ${unit}, p95 ${summary.p95.toFixed(digits)} ${unit}, max ${summary.max.toFixed(digits)} ${unit}`;
}

/** Grande table : grille 100 × 100 révélée à moitié, 200 jetons, historique de jets plein. */
function largeTableState(): TableState {
  const demo = createDemoTableState();
  const template = demo.tokens[2]!;
  return {
    ...demo,
    map: { name: "Grande carte", columns: LARGE_MAP_SIZE, rows: LARGE_MAP_SIZE },
    tokens: Array.from({ length: LARGE_TOKEN_COUNT }, (_, index) => ({
      ...template,
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      name: `Créature ${index}`,
      position: { column: index % LARGE_MAP_SIZE, row: (index * 7) % LARGE_MAP_SIZE },
      isVisibleToPlayers: index % 3 !== 0,
    })),
    revealedCells: Array.from({ length: (LARGE_MAP_SIZE * LARGE_MAP_SIZE) / 2 }, (_, index) => ({
      column: index % LARGE_MAP_SIZE,
      row: Math.floor(index / LARGE_MAP_SIZE),
    })),
    rolls: Array.from({ length: 50 }, (_, index) => ({
      id: `11111111-0000-4000-8000-${String(index).padStart(12, "0")}`,
      label: `Jet ${index}`,
      notation: "1d20+5",
      dice: [10],
      modifier: 5,
      total: 15,
      visibility: index % 2 === 0 ? ("public" as const) : ("gm" as const),
      rolledAt: "2026-11-24T12:00:00.000Z",
    })),
  };
}

function measureProjection(state: TableState): Summary {
  const samples: number[] = [];
  for (let index = 0; index < PROJECTION_ITERATIONS; index++) {
    const start = performance.now();
    projectForPlayers(state);
    samples.push((performance.now() - start) * 1000);
  }
  return summarize(samples);
}

describe("Délai de synchronisation MJ → joueurs", () => {
  let table: TableTestApp;
  let gm: Socket;
  let players: Socket[];

  beforeAll(async () => {
    table = await startTableTestApp();
    gm = await table.connect(DEMO_USERS.gameMaster);
    const gmJoined = nextGmState(gm);
    await emitWithAck(gm, TABLE_EVENTS.join, { campaignId: DEMO_CAMPAIGN_ID, audience: "gm" });
    await gmJoined;
    players = [];
    for (let index = 0; index < PLAYERS; index++) {
      const player = await table.connect(
        index % 2 === 0 ? DEMO_USERS.firstPlayer : DEMO_USERS.secondPlayer,
      );
      const joined = nextPlayerView(player);
      await emitWithAck(player, TABLE_EVENTS.join, {
        campaignId: DEMO_CAMPAIGN_ID,
        audience: "players",
      });
      await joined;
      players.push(player);
    }
  });

  afterAll(async () => {
    await table.close();
  });

  it("mesure le délai entre l'action du MJ et la réception par tous les joueurs", async () => {
    const goblin = createDemoTableState().tokens.find(
      (token) => token.name === "Gobelin éclaireur",
    )!;
    const allPlayers: number[] = [];
    const firstPlayer: number[] = [];
    const gmAck: number[] = [];

    for (let index = 0; index < WARMUP + ITERATIONS; index++) {
      const revision = index + 1;
      const position = { column: 3 + (index % 2), row: 2 };
      const start = performance.now();
      const received = players.map((player) =>
        playerViewAtRevision(player, revision).then(() => performance.now() - start),
      );
      const ack = emitWithAck(gm, TABLE_EVENTS.moveToken, {
        campaignId: DEMO_CAMPAIGN_ID,
        tokenId: goblin.id,
        position,
      }).then((reply) => {
        expect(reply).toEqual({ ok: true });
        return performance.now() - start;
      });
      const [ackTime, ...playerTimes] = await Promise.all([ack, ...received]);
      if (index < WARMUP) continue;
      gmAck.push(ackTime);
      allPlayers.push(Math.max(...playerTimes));
      firstPlayer.push(Math.min(...playerTimes));
    }

    const demoProjection = measureProjection(createDemoTableState());
    const largeProjection = measureProjection(largeTableState());
    const report = [
      `Machine : ${cpus()[0]?.model ?? "inconnue"} (${cpus().length} cœurs), ${platform()} ${release()}, Node ${process.version}`,
      `Paramètres : ${PLAYERS} joueurs, ${ITERATIONS} déplacements mesurés après ${WARMUP} d'échauffement`,
      `Tous les joueurs ont reçu : ${format(summarize(allPlayers), "ms")}`,
      `Premier joueur : ${format(summarize(firstPlayer), "ms")}`,
      `Accusé de réception du MJ : ${format(summarize(gmAck), "ms")}`,
      `projectForPlayers, table de démonstration : ${format(demoProjection, "µs", 1)}`,
      `projectForPlayers, grande table (100 × 100, 200 jetons) : ${format(largeProjection, "µs", 1)}`,
    ].join("\n");
    process.stdout.write(`\n${report}\n\n`);
    expect(allPlayers).toHaveLength(ITERATIONS);
  });
});
