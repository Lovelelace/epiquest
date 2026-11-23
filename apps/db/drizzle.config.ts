import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Fichier .env de la racine du dépôt, s'il existe (les variables déjà définies sont prioritaires).
if (existsSync("../../.env")) {
  process.loadEnvFile("../../.env");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://epiquest:epiquest@localhost:5432/epiquest",
  },
  strict: true,
  verbose: true,
});
