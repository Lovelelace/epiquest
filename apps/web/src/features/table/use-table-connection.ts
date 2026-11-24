"use client";

import {
  playerTableViewSchema,
  TABLE_EVENTS,
  tableAckSchema,
  tableStateSchema,
  type PlayerTableView,
  type TableAck,
  type TableAudience,
  type TableState,
} from "@epiquest/schemas";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/shared/lib/api";

/** Délai d'attente d'un accusé de réception du serveur. */
const ACK_TIMEOUT_MS = 5000;

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "refused";

interface AudienceSnapshot {
  gm: TableState;
  players: PlayerTableView;
}

const SNAPSHOT_SOURCES = {
  gm: { event: TABLE_EVENTS.gmState, schema: tableStateSchema },
  players: { event: TABLE_EVENTS.playerView, schema: playerTableViewSchema },
} as const;

export interface TableConnection<A extends TableAudience> {
  status: ConnectionStatus;
  /** Message lisible quand le serveur refuse l'accès. */
  refusal: string | null;
  snapshot: AudienceSnapshot[A] | null;
  /** Envoie une action au serveur et attend son accusé de réception. */
  send(event: string, payload: unknown): Promise<TableAck>;
}

const NOT_CONNECTED: TableAck = {
  ok: false,
  error: { code: "NOT_JOINED", message: "Connexion au serveur en cours, réessayez." },
};

/**
 * Connexion temps réel à la table d'une campagne, pour un public donné.
 * Le serveur décide de ce qui est envoyé : ce hook se contente de rejoindre la salle, de
 * garder le dernier état reçu (révision la plus haute) et de rejoindre après une reconnexion.
 */
export function useTableConnection<A extends TableAudience>(options: {
  campaignId: string;
  userId: string;
  audience: A;
}): TableConnection<A> {
  const { campaignId, userId, audience } = options;
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [refusal, setRefusal] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<AudienceSnapshot[A] | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_URL, { auth: { userId }, transports: ["websocket"] });
    socketRef.current = socket;
    const source = SNAPSHOT_SOURCES[audience];

    socket.on(source.event, (payload: unknown) => {
      const parsed = source.schema.safeParse(payload);
      if (!parsed.success) return; // message inattendu : on garde le dernier état valide
      // Le schéma choisi par `audience` produit exactement AudienceSnapshot[A].
      const next = parsed.data as AudienceSnapshot[A];
      setSnapshot((current) =>
        current !== null && current.revision > next.revision ? current : next,
      );
    });

    socket.on("connect", () => {
      setStatus("connecting");
      void socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck(TABLE_EVENTS.join, { campaignId, audience })
        .then((reply: unknown) => {
          const ack = tableAckSchema.parse(reply);
          if (ack.ok) {
            setStatus("connected");
            setRefusal(null);
          } else {
            setStatus("refused");
            setRefusal(ack.error.message);
          }
        })
        .catch(() => setStatus("reconnecting"));
    });
    socket.on("disconnect", () => setStatus("reconnecting"));
    socket.io.on("reconnect_attempt", () => setStatus("reconnecting"));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [campaignId, userId, audience]);

  const send = useCallback(async (event: string, payload: unknown): Promise<TableAck> => {
    const socket = socketRef.current;
    if (socket === null || !socket.connected) return NOT_CONNECTED;
    try {
      const reply: unknown = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck(event, payload);
      return tableAckSchema.parse(reply);
    } catch {
      return NOT_CONNECTED;
    }
  }, []);

  return { status, refusal, snapshot, send };
}
