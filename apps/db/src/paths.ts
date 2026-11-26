import { fileURLToPath } from "node:url";

/** Dossier des migrations SQL générées par drizzle-kit. */
export const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

/** Fichiers sources du SRD, versionnés dans le dépôt (valable depuis `src/` comme depuis `dist/`). */
export const srdDataFolder = fileURLToPath(new URL("../src/srd/data", import.meta.url));
