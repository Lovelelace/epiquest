import type { INestApplication } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import type { AddressInfo } from "node:net";
import { io, type Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RealtimeModule } from "./realtime.module.js";

describe("RealtimeGateway", () => {
  let app: INestApplication;
  let socket: Socket;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [RealtimeModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    socket = io(`http://localhost:${port}`, { transports: ["websocket"] });
  });

  afterAll(async () => {
    socket.disconnect();
    await app.close();
  });

  it("répond pong à un ping", async () => {
    const reply = await new Promise<string>((resolve) => {
      socket.once("pong", resolve);
      socket.emit("ping");
    });
    expect(reply).toBe("pong");
  });
});
