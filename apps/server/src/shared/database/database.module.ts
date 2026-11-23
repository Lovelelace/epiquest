import { createDatabase, type DatabaseConnection } from "@epiquest/db";
import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { APP_CONFIG } from "../config/config.module.js";
import type { AppConfig } from "../config/config.js";

/** Jeton d'injection de la connexion Drizzle : `@Inject(DATABASE) private readonly database: DatabaseConnection`. */
export const DATABASE = Symbol("DATABASE");

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): DatabaseConnection => createDatabase(config.databaseUrl),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE) private readonly database: DatabaseConnection) {}

  async onApplicationShutdown(): Promise<void> {
    await this.database.close();
  }
}
