import { type AnyPgColumn, index, integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { srdColumns, srdSize } from "./common.js";

/** Espèces (« races » dans le SRD 5.1). Une sous-espèce pointe vers son espèce parente. */
export const srdSpecies = pgTable(
  "srd_species",
  {
    ...srdColumns(),
    parentId: uuid("parent_id").references((): AnyPgColumn => srdSpecies.id, {
      onDelete: "cascade",
    }),
    size: srdSize("size"),
    speed: integer("speed"),
  },
  (table) => [
    index("srd_species_parent_idx").on(table.parentId),
    index("srd_species_search_idx").using("gin", table.search),
  ],
);

export type SrdSpecies = typeof srdSpecies.$inferSelect;
export type NewSrdSpecies = typeof srdSpecies.$inferInsert;
