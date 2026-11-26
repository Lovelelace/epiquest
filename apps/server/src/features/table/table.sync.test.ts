import { playerTableViewSchema, TABLE_EVENTS } from "@epiquest/schemas";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Socket } from "socket.io-client";
import { DEMO_CAMPAIGN_ID, DEMO_USERS } from "./campaign-membership.js";
import { createDemoTableState } from "./demo-table.js";
import {
  emitWithAck,
  nextGmState,
  nextPlayerView,
  playerViewAtRevision,
  recordMessages,
  startTableTestApp,
  type TableTestApp,
} from "./table.test-helpers.js";

const demo = createDemoTableState();
const tokenNamed = (name: string) => demo.tokens.find((token) => token.name === name)!;
const GOBLIN = tokenNamed("Gobelin éclaireur");
const CHIEF = tokenNamed("Chef gobelin");
const campaignId = DEMO_CAMPAIGN_ID;

describe("TableGateway : synchronisation des actions du MJ", () => {
  let table: TableTestApp;
  let gm: Socket;
  let player: Socket;

  beforeEach(async () => {
    table = await startTableTestApp();
    gm = await table.connect(DEMO_USERS.gameMaster);
    player = await table.connect(DEMO_USERS.firstPlayer);
    const gmJoined = nextGmState(gm);
    const playerJoined = nextPlayerView(player);
    await emitWithAck(gm, TABLE_EVENTS.join, { campaignId, audience: "gm" });
    await emitWithAck(player, TABLE_EVENTS.join, { campaignId, audience: "players" });
    await Promise.all([gmJoined, playerJoined]);
  });

  afterEach(async () => {
    await table.close();
  });

  it("diffuse un déplacement au MJ et aux joueurs", async () => {
    const gmUpdate = nextGmState(gm);
    const playerUpdate = nextPlayerView(player);
    const ack = await emitWithAck(gm, TABLE_EVENTS.moveToken, {
      campaignId,
      tokenId: GOBLIN.id,
      position: { column: 3, row: 3 },
    });
    expect(ack).toEqual({ ok: true });
    expect((await gmUpdate).revision).toBe(1);
    const view = await playerUpdate;
    expect(view.tokens.find((token) => token.id === GOBLIN.id)?.position).toEqual({
      column: 3,
      row: 3,
    });
  });

  it("montre aux joueurs une créature dont la case vient d'être révélée", async () => {
    const wolf = tokenNamed("Loup");
    const playerUpdate = nextPlayerView(player);
    await emitWithAck(gm, TABLE_EVENTS.setFog, {
      campaignId,
      cells: [wolf.position],
      isRevealed: true,
    });
    expect((await playerUpdate).tokens.map((token) => token.id)).toContain(wolf.id);
  });

  it("envoie aux joueurs un état de santé approximatif, jamais les PV exacts", async () => {
    const playerUpdate = nextPlayerView(player);
    await emitWithAck(gm, TABLE_EVENTS.setHitPoints, {
      campaignId,
      tokenId: GOBLIN.id,
      current: 2,
    });
    const goblin = (await playerUpdate).tokens.find((token) => token.id === GOBLIN.id);
    expect(goblin?.health).toEqual({ type: "approximate", status: "bloodied" });
  });

  it("diffuse un jet public tiré par le serveur", async () => {
    const playerUpdate = nextPlayerView(player);
    const ack = await emitWithAck(gm, TABLE_EVENTS.roll, {
      campaignId,
      label: "Initiative",
      notation: "1d20+2",
      visibility: "public",
    });
    expect(ack).toEqual({ ok: true });
    const [roll] = (await playerUpdate).rolls;
    expect(roll?.label).toBe("Initiative");
    expect(roll?.total).toBe((roll?.dice[0] ?? 0) + 2);
  });

  it("n'envoie jamais un jet secret aux joueurs, ni même un signal", async () => {
    const received = recordMessages(player);
    const gmSecret = nextGmState(gm);
    await emitWithAck(gm, TABLE_EVENTS.roll, {
      campaignId,
      label: "JET-SECRET Discrétion",
      notation: "1d20+6",
      visibility: "gm",
    });
    expect((await gmSecret).rolls.map((roll) => roll.label)).toEqual(["JET-SECRET Discrétion"]);

    // Une action publique ensuite (révision 2) : les messages d'une connexion arrivent dans
    // l'ordre, donc tout message causé par le jet secret serait reçu avant celui-ci.
    const publicUpdate = playerViewAtRevision(player, 2);
    await emitWithAck(gm, TABLE_EVENTS.moveToken, {
      campaignId,
      tokenId: GOBLIN.id,
      position: { column: 3, row: 2 },
    });
    await publicUpdate;
    expect(received.map((message) => revisionOf(message.payload))).toEqual([2]);
    expect(JSON.stringify(received)).not.toContain("JET-SECRET");
  });

  it("n'envoie rien aux joueurs quand un jeton caché se déplace", async () => {
    const received = recordMessages(player);
    await emitWithAck(gm, TABLE_EVENTS.moveToken, {
      campaignId,
      tokenId: CHIEF.id,
      position: { column: 2, row: 1 },
    });
    const publicUpdate = playerViewAtRevision(player, 2);
    await emitWithAck(gm, TABLE_EVENTS.setHitPoints, {
      campaignId,
      tokenId: GOBLIN.id,
      current: 6,
    });
    const view = await publicUpdate;
    expect(received.map((message) => revisionOf(message.payload))).toEqual([2]);
    expect(view.tokens.map((token) => token.id)).not.toContain(CHIEF.id);
  });

  it("refuse une action à un joueur", async () => {
    const ack = await emitWithAck(player, TABLE_EVENTS.moveToken, {
      campaignId,
      tokenId: GOBLIN.id,
      position: { column: 0, row: 0 },
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("refuse une action depuis la seconde fenêtre du MJ, en lecture seule", async () => {
    const secondWindow = await table.connect(DEMO_USERS.gameMaster);
    await emitWithAck(secondWindow, TABLE_EVENTS.join, { campaignId, audience: "players" });
    const ack = await emitWithAck(secondWindow, TABLE_EVENTS.setFog, {
      campaignId,
      cells: [{ column: 0, row: 0 }],
      isRevealed: false,
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("refuse une action sur une table que la connexion n'a pas rejointe", async () => {
    const other = await table.connect(DEMO_USERS.gameMaster);
    const ack = await emitWithAck(other, TABLE_EVENTS.moveToken, {
      campaignId,
      tokenId: GOBLIN.id,
      position: { column: 0, row: 0 },
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "NOT_JOINED" } });
  });

  it("refuse un message mal formé", async () => {
    const ack = await emitWithAck(gm, TABLE_EVENTS.setHitPoints, {
      campaignId,
      tokenId: GOBLIN.id,
      current: -3,
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "INVALID_MESSAGE" } });
  });

  it("refuse une notation de dés inconnue", async () => {
    const ack = await emitWithAck(gm, TABLE_EVENTS.roll, {
      campaignId,
      label: "Jet",
      notation: "3d7",
      visibility: "public",
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "INVALID_DICE_NOTATION" } });
  });

  it("renvoie l'erreur métier de l'action refusée", async () => {
    const ack = await emitWithAck(gm, TABLE_EVENTS.moveToken, {
      campaignId,
      tokenId: GOBLIN.id,
      position: { column: 50, row: 0 },
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "OUT_OF_MAP" } });
  });
});

function revisionOf(payload: unknown): number {
  return playerTableViewSchema.parse(payload).revision;
}
