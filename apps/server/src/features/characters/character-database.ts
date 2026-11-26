import type { DatabaseConnection, SrdDatabase } from "@epiquest/db";
import { DATABASE } from "../../shared/database/database.module.js";

/** Jeton d'injection de la base des personnages (remplacée par PGlite dans les tests). */
export const CHARACTER_DATABASE = Symbol("CHARACTER_DATABASE");

export const characterDatabaseProvider = {
  provide: CHARACTER_DATABASE,
  inject: [DATABASE],
  useFactory: (connection: DatabaseConnection): SrdDatabase => connection.db,
};
