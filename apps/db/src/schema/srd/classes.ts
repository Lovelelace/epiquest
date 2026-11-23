import { check, index, integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { srdColumns } from "./common.js";

/** Classes de personnage. */
export const srdClasses = pgTable(
  "srd_classes",
  {
    ...srdColumns(),
    hitDie: integer("hit_die").notNull(),
  },
  (table) => [
    check("srd_classes_hit_die_check", sql`${table.hitDie} in (6, 8, 10, 12)`),
    index("srd_classes_search_idx").using("gin", table.search),
  ],
);

/** Sous-classes, rattachées à leur classe. */
export const srdSubclasses = pgTable(
  "srd_subclasses",
  {
    ...srdColumns(),
    classId: uuid("class_id")
      .notNull()
      .references(() => srdClasses.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("srd_subclasses_class_idx").on(table.classId),
    index("srd_subclasses_search_idx").using("gin", table.search),
  ],
);

export type SrdClass = typeof srdClasses.$inferSelect;
export type NewSrdClass = typeof srdClasses.$inferInsert;
export type SrdSubclass = typeof srdSubclasses.$inferSelect;
export type NewSrdSubclass = typeof srdSubclasses.$inferInsert;
