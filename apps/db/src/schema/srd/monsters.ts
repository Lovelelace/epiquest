import { sql } from "drizzle-orm";
import { check, doublePrecision, index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { MonsterAction } from "../../srd/monster-attacks.js";
import { srdColumns, srdSize } from "./common.js";

/** Monstres et PNJ. Le facteur de puissance est un nombre décimal (1/8 = 0,125). */
export const srdMonsters = pgTable(
  "srd_monsters",
  {
    ...srdColumns(),
    size: srdSize("size").notNull(),
    type: text("type").notNull(),
    challengeRating: doublePrecision("challenge_rating").notNull(),
    armorClass: integer("armor_class").notNull(),
    hitPoints: integer("hit_points").notNull(),
    /** Actions du monstre ; les attaques sont converties en effets quand c'est possible. */
    actions: jsonb("actions").$type<MonsterAction[]>().notNull().default([]),
  },
  (table) => [
    check("srd_monsters_challenge_rating_check", sql`${table.challengeRating} >= 0`),
    check("srd_monsters_hit_points_check", sql`${table.hitPoints} > 0`),
    index("srd_monsters_challenge_rating_idx").on(table.challengeRating),
    index("srd_monsters_type_idx").on(table.type),
    index("srd_monsters_search_idx").using("gin", table.search),
  ],
);

export type SrdMonster = typeof srdMonsters.$inferSelect;
export type NewSrdMonster = typeof srdMonsters.$inferInsert;
