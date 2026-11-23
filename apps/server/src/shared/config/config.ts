import { getDatabaseUrl } from "@epiquest/db";

export interface AppConfig {
  port: number;
  /** Origine autorisée pour les appels du client web (CORS HTTP et Socket.IO). */
  webOrigin: string;
  databaseUrl: string;
}

/** Lit la configuration depuis les variables d'environnement et échoue clairement si elle est invalide. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT invalide : « ${env.PORT} » (attendu : entier positif).`);
  }
  return {
    port,
    webOrigin: env.WEB_ORIGIN ?? "http://localhost:3001",
    databaseUrl: getDatabaseUrl(env),
  };
}
