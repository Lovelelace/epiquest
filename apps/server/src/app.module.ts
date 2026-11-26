import { Module } from "@nestjs/common";
import { ConfigModule } from "./shared/config/config.module.js";
import { DatabaseModule } from "./shared/database/database.module.js";
import { HealthModule } from "./shared/health/health.module.js";
import { SrdModule } from "./features/srd/srd.module.js";
import { RealtimeModule } from "./shared/realtime/realtime.module.js";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    RealtimeModule,
    // Modules des features : un par dossier de src/features/
    SrdModule,
  ],
})
export class AppModule {}
