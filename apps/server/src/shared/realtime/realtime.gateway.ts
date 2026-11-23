import { SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";

/**
 * Passerelle Socket.IO de base : vérifie que le temps réel fonctionne.
 * Les features déclarent leurs propres passerelles dans leur dossier.
 * Le CORS est configuré par l'adaptateur (voir main.ts).
 */
@WebSocketGateway()
export class RealtimeGateway {
  @SubscribeMessage("ping")
  ping(): { event: string; data: string } {
    return { event: "pong", data: "pong" };
  }
}
