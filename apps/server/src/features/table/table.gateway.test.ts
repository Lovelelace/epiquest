import { playerTableViewSchema, TABLE_EVENTS } from "@epiquest/schemas";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEMO_CAMPAIGN_ID, DEMO_USERS } from "./campaign-membership.js";
import { TableGateway } from "./table.gateway.js";
import {
  emitWithAck,
  nextGmState,
  nextPlayerView,
  recordMessages,
  startTableTestApp,
  type TableTestApp,
} from "./table.test-helpers.js";

const OTHER_CAMPAIGN_ID = "11111111-2222-4333-8444-555555555555";

describe("TableGateway : entrée dans les salles", () => {
  let table: TableTestApp;

  beforeEach(async () => {
    table = await startTableTestApp();
  });

  afterEach(async () => {
    await table.close();
  });

  it("envoie l'état complet au MJ qui rejoint la salle du MJ", async () => {
    const gm = await table.connect(DEMO_USERS.gameMaster);
    const state = nextGmState(gm);
    const ack = await emitWithAck(gm, TABLE_EVENTS.join, {
      campaignId: DEMO_CAMPAIGN_ID,
      audience: "gm",
    });
    expect(ack).toEqual({ ok: true });
    expect((await state).tokens.some((token) => !token.isVisibleToPlayers)).toBe(true);
  });

  it("envoie la vue projetée au joueur qui rejoint la salle des joueurs", async () => {
    const player = await table.connect(DEMO_USERS.firstPlayer);
    const view = nextPlayerView(player);
    await emitWithAck(player, TABLE_EVENTS.join, {
      campaignId: DEMO_CAMPAIGN_ID,
      audience: "players",
    });
    expect(playerTableViewSchema.safeParse(await view).success).toBe(true);
  });

  it("n'envoie que la vue projetée au MJ qui ouvre la salle des joueurs", async () => {
    const secondWindow = await table.connect(DEMO_USERS.gameMaster);
    const received = recordMessages(secondWindow);
    const view = nextPlayerView(secondWindow);
    await emitWithAck(secondWindow, TABLE_EVENTS.join, {
      campaignId: DEMO_CAMPAIGN_ID,
      audience: "players",
    });
    await view;
    expect(received.map((message) => message.event)).toEqual([TABLE_EVENTS.playerView]);
    expect(JSON.stringify(received)).not.toContain("gmNotes");
  });

  it("refuse la salle du MJ à un joueur, sans rien lui envoyer", async () => {
    const player = await table.connect(DEMO_USERS.firstPlayer);
    const received = recordMessages(player);
    const ack = await emitWithAck(player, TABLE_EVENTS.join, {
      campaignId: DEMO_CAMPAIGN_ID,
      audience: "gm",
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(received).toEqual([]);
  });

  it("refuse une campagne dont l'utilisateur n'est pas membre", async () => {
    const stranger = await table.connect("intrus");
    const ack = await emitWithAck(stranger, TABLE_EVENTS.join, {
      campaignId: DEMO_CAMPAIGN_ID,
      audience: "players",
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "NOT_A_MEMBER" } });
  });

  it("répond de la même façon pour une campagne inexistante, sans révéler qu'elle n'existe pas", async () => {
    const gm = await table.connect(DEMO_USERS.gameMaster);
    const ack = await emitWithAck(gm, TABLE_EVENTS.join, {
      campaignId: OTHER_CAMPAIGN_ID,
      audience: "players",
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "NOT_A_MEMBER" } });
  });

  it("refuse une connexion sans identité", async () => {
    const anonymous = await table.connect();
    const ack = await emitWithAck(anonymous, TABLE_EVENTS.join, {
      campaignId: DEMO_CAMPAIGN_ID,
      audience: "players",
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
  });

  it("refuse un message mal formé", async () => {
    const gm = await table.connect(DEMO_USERS.gameMaster);
    const ack = await emitWithAck(gm, TABLE_EVENTS.join, {
      campaignId: "pas-un-uuid",
      audience: "gm",
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "INVALID_MESSAGE" } });
  });

  it("range chaque connexion dans la salle de sa campagne et de son public", async () => {
    const gm = await table.connect(DEMO_USERS.gameMaster);
    const player = await table.connect(DEMO_USERS.firstPlayer);
    await emitWithAck(gm, TABLE_EVENTS.join, { campaignId: DEMO_CAMPAIGN_ID, audience: "gm" });
    await emitWithAck(player, TABLE_EVENTS.join, {
      campaignId: DEMO_CAMPAIGN_ID,
      audience: "players",
    });

    const rooms = roomMembers(table);
    expect(rooms.get(`campaign:${DEMO_CAMPAIGN_ID}:gm`)).toBe(1);
    expect(rooms.get(`campaign:${DEMO_CAMPAIGN_ID}:players`)).toBe(1);
  });
});

function roomMembers(table: TableTestApp): Map<string, number> {
  const server = table.app.get(TableGateway).server;
  const counts = new Map<string, number>();
  for (const [room, members] of server.of("/").adapter.rooms) counts.set(room, members.size);
  return counts;
}
