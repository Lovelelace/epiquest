import type { INestApplicationContext } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import type { Server, ServerOptions } from "socket.io";

/** Adaptateur Socket.IO qui applique la même origine autorisée que l'API HTTP. */
export class CorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origin: string,
  ) {
    super(app);
  }

  override createIOServer(port: number | undefined, options?: ServerOptions): Server {
    const withCors = {
      ...options,
      cors: { origin: this.origin, credentials: true },
    } as ServerOptions; // exactOptionalPropertyTypes : les options de Nest sont partielles
    return super.createIOServer(port, withCors);
  }
}
