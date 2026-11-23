import { index, pgTable } from "drizzle-orm/pg-core";
import { srdColumns } from "./common.js";

/** États (aveuglé, empoigné, à terre…). */
export const srdConditions = pgTable("srd_conditions", srdColumns(), (table) => [
  index("srd_conditions_search_idx").using("gin", table.search),
]);

export type SrdCondition = typeof srdConditions.$inferSelect;
export type NewSrdCondition = typeof srdConditions.$inferInsert;
