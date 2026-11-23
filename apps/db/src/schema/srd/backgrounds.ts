import { index, pgTable } from "drizzle-orm/pg-core";
import { srdColumns } from "./common.js";

/** Historiques de personnage. */
export const srdBackgrounds = pgTable("srd_backgrounds", srdColumns(), (table) => [
  index("srd_backgrounds_search_idx").using("gin", table.search),
]);

export type SrdBackground = typeof srdBackgrounds.$inferSelect;
export type NewSrdBackground = typeof srdBackgrounds.$inferInsert;
