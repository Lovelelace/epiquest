import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { srdClasses } from "./classes.js";
import { srdColumns } from "./common.js";

/** Niveau maximal d'un sort (0 = sort mineur). */
export const MAX_SPELL_LEVEL = 9;

/** Sorts. */
export const srdSpells = pgTable(
  "srd_spells",
  {
    ...srdColumns(),
    level: integer("level").notNull(),
    school: text("school").notNull(),
    castingTime: text("casting_time").notNull(),
    range: text("range").notNull(),
    duration: text("duration").notNull(),
    isRitual: boolean("is_ritual").notNull().default(false),
    requiresConcentration: boolean("requires_concentration").notNull().default(false),
  },
  (table) => [
    check(
      "srd_spells_level_check",
      sql`${table.level} between 0 and ${sql.raw(String(MAX_SPELL_LEVEL))}`,
    ),
    index("srd_spells_level_school_idx").on(table.level, table.school),
    index("srd_spells_search_idx").using("gin", table.search),
  ],
);

/** Classes qui ont accès à chaque sort. */
export const srdSpellClasses = pgTable(
  "srd_spell_classes",
  {
    spellId: uuid("spell_id")
      .notNull()
      .references(() => srdSpells.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => srdClasses.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.spellId, table.classId] }),
    index("srd_spell_classes_class_idx").on(table.classId),
  ],
);

export type SrdSpell = typeof srdSpells.$inferSelect;
export type NewSrdSpell = typeof srdSpells.$inferInsert;
export type SrdSpellClass = typeof srdSpellClasses.$inferSelect;
