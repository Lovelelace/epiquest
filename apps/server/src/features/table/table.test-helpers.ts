import {
  TABLE_EVENTS,
  type PlayerTableView,
  type TableAck,
  type TableState,
} from "@epiquest/schemas";
import type { INestApplication } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import type { AddressInfo } from "node:net";
import { io, type Socket } from "socket.io-client";
import { TableModule } from "./table.module.js";

/** Délai au-delà duquel un message attendu est considéré comme jamais reçu. */
const RECEIVE_TIMEOUT_MS = 2000;

export interface TableTestApp {
  app: INestApplication;
  url: string;
  connect(userId?: string): Promise<Socket>;
  close(): Promise<void>;
}

/** Démarre un vrai serveur Socket.IO avec le module de la table, sur un port libre. */
export async function startTableTestApp(): Promise<TableTestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [TableModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(0);
  const { port } = app.getHttpServer().address() as AddressInfo; // serveur HTTP Node écoutant en TCP
  const url = `http://localhost:${port}`;
  const sockets: Socket[] = [];

  return {
    app,
    url,
    async connect(userId?: string): Promise<Socket> {
      const auth = userId === undefined ? {} : { userId };
      const socket = io(url, { transports: ["websocket"], auth, forceNew: true });
      sockets.push(socket);
      await new Promise<void>((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", reject);
      });
      return socket;
    },
    async close(): Promise<void> {
      for (const socket of sockets) socket.disconnect();
      await app.close();
    },
  };
}

/** Émet un message et attend l'accusé de réception du serveur. */
export function emitWithAck(socket: Socket, event: string, payload: unknown): Promise<TableAck> {
  return socket.timeout(RECEIVE_TIMEOUT_MS).emitWithAck(event, payload) as Promise<TableAck>; // forme garantie par la passerelle
}

/** Attend le prochain message d'un événement, ou échoue après le délai. */
export function nextMessage<T>(socket: Socket, event: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onMessage);
      reject(new Error(`Aucun message « ${event} » reçu`));
    }, RECEIVE_TIMEOUT_MS);
    function onMessage(payload: T): void {
      clearTimeout(timer);
      resolve(payload);
    }
    socket.once(event, onMessage);
  });
}

/** Enregistre tous les messages reçus par une connexion, pour vérifier ce qui n'est jamais arrivé. */
export function recordMessages(socket: Socket): Array<{ event: string; payload: unknown }> {
  const received: Array<{ event: string; payload: unknown }> = [];
  socket.onAny((event: string, payload: unknown) => received.push({ event, payload }));
  return received;
}

export const nextGmState = (socket: Socket): Promise<TableState> =>
  nextMessage<TableState>(socket, TABLE_EVENTS.gmState);

export const nextPlayerView = (socket: Socket): Promise<PlayerTableView> =>
  nextMessage<PlayerTableView>(socket, TABLE_EVENTS.playerView);
