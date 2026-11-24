import {
  joinTableMessageSchema,
  TABLE_EVENTS,
  tableHandshakeSchema,
  type CampaignId,
  type TableAck,
  type TableAudience,
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
import type { DefaultEventsMap, Server, Socket } from "socket.io";
import { CAMPAIGN_MEMBERSHIP, type CampaignMembership } from "./campaign-membership.js";
import { projectForPlayers } from "./project-for-players.js";
import { TABLE_OK, tableError } from "./table-errors.js";
import { tableRoom } from "./table-rooms.js";
import { TABLE_STATE_STORE, type TableStateStore } from "./table-state.store.js";

/** Ce que le serveur retient d'une connexion. Rien de ceci ne vient du client sans validation. */
export interface TableSocketData {
  userId?: string;
  table?: { campaignId: CampaignId; audience: TableAudience };
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

  private async leaveCurrentTable(client: TableSocket): Promise<void> {
    const current = client.data.table;
    if (current === undefined) return;
    await client.leave(tableRoom(current.campaignId, current.audience));
    delete client.data.table;
  }
}
