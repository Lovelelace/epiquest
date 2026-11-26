import { index, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { srdColumns } from "./common.js";

/** Origine d'un objet : équipement courant ou objet magique. */
export const srdItemKind = pgEnum("srd_item_kind", ["equipment", "magic_item"]);

/** Objets : équipement (armes, armures, matériel) et objets magiques. */
export const srdItems = pgTable(
  "srd_items",
  {
    ...srdColumns(),
    kind: srdItemKind("kind").notNull(),
    category: text("category").notNull(),
    rarity: text("rarity"),
  },
  (table) => [
    index("srd_items_kind_category_idx").on(table.kind, table.category),
    index("srd_items_search_idx").using("gin", table.search),
  ],
);

export type SrdItem = typeof srdItems.$inferSelect;
export type NewSrdItem = typeof srdItems.$inferInsert;
