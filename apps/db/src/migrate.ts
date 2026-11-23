import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "./client.js";
import { getDatabaseUrl, loadRootEnvFile } from "./env.js";
import { migrationsFolder } from "./paths.js";

loadRootEnvFile();
const { db, close } = createDatabase(getDatabaseUrl());

try {
  await migrate(db, { migrationsFolder });
  console.info("Migrations appliquées.");
} catch (error) {
  console.error("Échec des migrations :", error);
  process.exitCode = 1;
} finally {
  await close();
}
