import { PGlite } from "@electric-sql/pglite";
import { importSrd, migrationsFolder, schema } from "@epiquest/db";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { RandomModule, ROLL_DIE } from "../../shared/random/random.module.js";
import { SRD_DATABASE } from "../srd/srd.service.js";
import { CHARACTER_DATABASE } from "./character-database.js";
import { CharactersModule } from "./characters.module.js";

export interface TestApp {
  app: INestApplication;
  close: () => Promise<void>;
}

/** Application de test : base PGlite migrée, SRD complet importé, module des personnages. */
export async function createTestApp(
  rollDie: (sides: number) => number = () => 4,
): Promise<TestApp> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  await importSrd(db);
  const moduleRef = await Test.createTestingModule({ imports: [CharactersModule, RandomModule] })
    .overrideProvider(ROLL_DIE)
    .useValue(rollDie)
    .overrideProvider(SRD_DATABASE)
    .useValue(db)
    .overrideProvider(CHARACTER_DATABASE)
    .useValue(db)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return {
    app,
    close: async () => {
      await app.close();
      await client.close();
    },
  };
}
