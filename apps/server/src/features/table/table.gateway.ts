import {
  joinTableMessageSchema,
  moveTokenMessageSchema,
  rollMessageSchema,
  setFogMessageSchema,
  setHitPointsMessageSchema,
  setTokenVisibilityMessageSchema,
  TABLE_EVENTS,
  tableHandshakeSchema,
  type CampaignId,
  type PlayerTableView,
  type TableAck,
  type TableAudience,
  type TableState,
} from "@epiquest/schemas";
import { Inject, Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
} from "@nestjs/websockets";
import { randomUUID } from "node:crypto";
import type { DefaultEventsMap, Server, Socket } from "socket.io";
import { CAMPAIGN_MEMBERSHIP, type CampaignMembership } from "./campaign-membership.js";
import { DICE_ROLLER, type DiceRoller } from "./dice-roller.js";
import { projectForPlayers } from "./project-for-players.js";
import {
  appendRoll,
  moveToken,
  setFog,
  setHitPoints,
  setTokenVisibility,
  type ActionResult,
} from "./table-actions.js";
import { TABLE_OK, tableError } from "./table-errors.js";
import { tableRoom } from "./table-rooms.js";
import { TABLE_STATE_STORE, type TableStateStore } from "./table-state.store.js";

/** Ce que le serveur retient d'une connexion. Rien de ceci ne vient du client sans validation. */
export interface TableSocketData {
  userId?: string;
  table?: { campaignId: CampaignId; audience: TableAudience };
}

/** Ce dont la passerelle a besoin d'un schéma zod, sans dépendre de zod directement. */
interface MessageSchema<Message> {
  safeParse(input: unknown): { success: true; data: Message } | { success: false };
}

export type TableSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  TableSocketData
>;

/**
 * Passerelle de la table : range chaque connexion dans la salle de sa campagne et de son public.
 * Le MJ peut ouvrir la salle des joueurs (seconde fenêtre) ; il n'y reçoit alors que la vue
 * projetée. Un joueur ne peut jamais entrer dans la salle du MJ (SEC-07).
 */
@WebSocketGateway()
export class TableGateway implements OnGatewayConnection<TableSocket> {
  @WebSocketServer() readonly server!: Server; // fourni par Nest après l'initialisation
  private readonly logger = new Logger(TableGateway.name);

  constructor(
    @Inject(CAMPAIGN_MEMBERSHIP) private readonly membership: CampaignMembership,
    @Inject(TABLE_STATE_STORE) private readonly store: TableStateStore,
    @Inject(DICE_ROLLER) private readonly diceRoller: DiceRoller,
  ) {}

  handleConnection(client: TableSocket): void {
    const handshake = tableHandshakeSchema.safeParse(client.handshake.auth);
    if (handshake.success) client.data.userId = handshake.data.userId;
  }

  @SubscribeMessage(TABLE_EVENTS.join)
  async join(
    @ConnectedSocket() client: TableSocket,
    @MessageBody() body: unknown,
  ): Promise<TableAck> {
    const message = joinTableMessageSchema.safeParse(body);
    if (!message.success) return tableError("INVALID_MESSAGE");
    const { userId } = client.data;
    if (userId === undefined) return tableError("UNAUTHENTICATED");

    const { campaignId, audience } = message.data;
    const role = this.membership.roleOf(userId, campaignId);
    const state = this.store.get(campaignId);
    if (role === null || state === undefined) return tableError("NOT_A_MEMBER");
    if (audience === "gm" && role !== "gm") return tableError("FORBIDDEN");

    await this.leaveCurrentTable(client);
    await client.join(tableRoom(campaignId, audience));
    client.data.table = { campaignId, audience };
    this.logger.debug(`Connexion ${client.id} : salle ${tableRoom(campaignId, audience)}`);

    if (audience === "gm") client.emit(TABLE_EVENTS.gmState, state);
    else client.emit(TABLE_EVENTS.playerView, projectForPlayers(state));
    return TABLE_OK;
  }

  @SubscribeMessage(TABLE_EVENTS.moveToken)
  moveToken(@ConnectedSocket() client: TableSocket, @MessageBody() body: unknown): TableAck {
    return this.runGmAction(client, body, moveTokenMessageSchema, (state, message) =>
      moveToken(state, message.tokenId, message.position),
    );
  }

  @SubscribeMessage(TABLE_EVENTS.setFog)
  setFog(@ConnectedSocket() client: TableSocket, @MessageBody() body: unknown): TableAck {
    return this.runGmAction(client, body, setFogMessageSchema, (state, message) =>
      setFog(state, message.cells, message.isRevealed),
    );
  }

  @SubscribeMessage(TABLE_EVENTS.setTokenVisibility)
  setTokenVisibility(
    @ConnectedSocket() client: TableSocket,
    @MessageBody() body: unknown,
  ): TableAck {
    return this.runGmAction(client, body, setTokenVisibilityMessageSchema, (state, message) =>
      setTokenVisibility(state, message.tokenId, message.isVisibleToPlayers),
    );
  }

  @SubscribeMessage(TABLE_EVENTS.setHitPoints)
  setHitPoints(@ConnectedSocket() client: TableSocket, @MessageBody() body: unknown): TableAck {
    return this.runGmAction(client, body, setHitPointsMessageSchema, (state, message) =>
      setHitPoints(state, message.tokenId, message.current),
    );
  }

  /** Le jet est tiré ici, côté serveur (SEC-02) ; le client n'a envoyé qu'une intention. */
  @SubscribeMessage(TABLE_EVENTS.roll)
  roll(@ConnectedSocket() client: TableSocket, @MessageBody() body: unknown): TableAck {
    return this.runGmAction(client, body, rollMessageSchema, (state, message) => {
      const outcome = this.diceRoller.roll(message.notation);
      if (outcome === null) return { ok: false, code: "INVALID_DICE_NOTATION" };
      return appendRoll(state, {
        id: randomUUID(),
        label: message.label,
        notation: message.notation,
        visibility: message.visibility,
        rolledAt: new Date().toISOString(),
        ...outcome,
      });
    });
  }

  /**
   * Chemin commun des actions du MJ : valider le message (DATA-05), vérifier que la connexion
   * est dans la salle du MJ de cette campagne et que l'utilisateur y est toujours MJ (SEC-07),
   * appliquer l'action pure, enregistrer, puis diffuser.
   */
  private runGmAction<Message extends { campaignId: CampaignId }>(
    client: TableSocket,
    body: unknown,
    schema: MessageSchema<Message>,
    apply: (state: TableState, message: Message) => ActionResult,
  ): TableAck {
    const parsed = schema.safeParse(body);
    if (!parsed.success) return tableError("INVALID_MESSAGE");
    const message = parsed.data;
    const { table, userId } = client.data;
    if (table === undefined || userId === undefined || table.campaignId !== message.campaignId) {
      return tableError("NOT_JOINED");
    }
    if (table.audience !== "gm" || this.membership.roleOf(userId, message.campaignId) !== "gm") {
      return tableError("FORBIDDEN");
    }
    const state = this.store.get(message.campaignId);
    if (state === undefined) return tableError("NOT_JOINED");

    const result = apply(state, message);
    if (!result.ok) return tableError(result.code);
    this.store.save(result.state);
    this.broadcast(state, result.state);
    return TABLE_OK;
  }

  /**
   * Une seule projection par changement, partagée par toute la salle des joueurs. Si l'action
   * ne change rien de ce que voient les joueurs (jeton caché déplacé, jet secret), rien ne leur
   * est envoyé : même le moment d'une action cachée ne doit pas fuiter (SEC-08).
   */
  private broadcast(previous: TableState, state: TableState): void {
    this.server.to(tableRoom(state.campaignId, "gm")).emit(TABLE_EVENTS.gmState, state);
    const view = projectForPlayers(state);
    if (visibleContent(projectForPlayers(previous)) === visibleContent(view)) return;
    this.server.to(tableRoom(state.campaignId, "players")).emit(TABLE_EVENTS.playerView, view);
  }

  private async leaveCurrentTable(client: TableSocket): Promise<void> {
    const current = client.data.table;
    if (current === undefined) return;
    await client.leave(tableRoom(current.campaignId, current.audience));
    delete client.data.table;
  }
}

/** Ce que les joueurs voient, sans la révision qui change à chaque action. */
function visibleContent(view: PlayerTableView): string {
  return JSON.stringify({ ...view, revision: 0 });
}
