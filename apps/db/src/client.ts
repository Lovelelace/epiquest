import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export type Database = PostgresJsDatabase<typeof schema>;

export interface DatabaseConnection {
  db: Database;
  /** Ferme les connexions ouvertes (à appeler à l'arrêt du serveur). */
  close: () => Promise<void>;
}

/** Crée une connexion à PostgreSQL. La connexion réelle n'est ouverte qu'à la première requête. */
export function createDatabase(url: string): DatabaseConnection {
  const client = postgres(url);
  return {
    db: drizzle(client, { schema }),
    close: () => client.end(),
  };
}
