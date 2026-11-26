import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Versions du SRD importées : une ligne par version, mise à jour à chaque import. */
export const srdImports = pgTable("srd_imports", {
  srdVersion: text("srd_version").primaryKey(),
  sourceRepository: text("source_repository").notNull(),
  sourceRef: text("source_ref").notNull(),
  sourceCommit: text("source_commit").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SrdImport = typeof srdImports.$inferSelect;
