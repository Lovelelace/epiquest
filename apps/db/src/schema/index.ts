/**
 * Point d'entrée du schéma Drizzle.
 *
 * Chaque feature déclare ses tables dans son propre fichier, `src/schema/<feature>.ts`,
 * puis on le réexporte ici : `export * from "./<feature>.js";`
 * drizzle-kit lit ce fichier pour générer les migrations.
 */
export * from "./srd/index.js";
