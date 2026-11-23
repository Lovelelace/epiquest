import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Fichier .env à la racine du dépôt (même chemin depuis src/ et depuis dist/). */
const ROOT_ENV_FILE = fileURLToPath(new URL("../../../.env", import.meta.url));

/**
 * Charge le fichier .env de la racine du dépôt s'il existe. Les variables déjà définies
 * (Docker, CI) gardent leur valeur : le fichier ne sert qu'en développement local.
 */
export function loadRootEnvFile(path: string = ROOT_ENV_FILE): void {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}

/** Lit l'URL de connexion PostgreSQL et échoue avec un message clair si elle manque. */
export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL n'est pas définie. Copiez .env.example en .env ou passez la variable au processus.",
    );
  }
  return url;
}
