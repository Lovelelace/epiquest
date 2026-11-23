import { fileURLToPath } from "node:url";

/** Dossier des migrations SQL générées par drizzle-kit. */
export const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));
