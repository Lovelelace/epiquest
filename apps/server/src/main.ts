import "reflect-metadata";
import { loadRootEnvFile } from "@epiquest/db";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { APP_CONFIG } from "./shared/config/config.module.js";
import type { AppConfig } from "./shared/config/config.js";
import { CorsIoAdapter } from "./shared/realtime/cors-io.adapter.js";

loadRootEnvFile();

const app = await NestFactory.create(AppModule);
const config = app.get<AppConfig>(APP_CONFIG);

app.enableCors({ origin: config.webOrigin, credentials: true });
app.useWebSocketAdapter(new CorsIoAdapter(app, config.webOrigin));
app.enableShutdownHooks();

await app.listen(config.port, "0.0.0.0");
Logger.log(`API prête sur http://localhost:${config.port}`, "Bootstrap");
