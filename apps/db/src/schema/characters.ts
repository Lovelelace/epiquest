import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Brouillons de l'assistant de création. Les choix sont stockés tels quels (JSON validé par
 * `draftChoicesSchema` côté serveur) : ils restent incomplets tant que le personnage n'est pas créé.
 */
export const characterDrafts = pgTable("character_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  step: text("step").notNull().default("species"),
  choices: jsonb("choices").notNull(),
  /** Tirages 4d6 faits par le serveur ; `null` tant que le joueur n'a pas tiré. */
  abilityRolls: jsonb("ability_rolls"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CharacterDraftRow = typeof characterDrafts.$inferSelect;

/**
 * Personnages créés. Les choix (`choices`) sont la source de vérité : les statistiques sont
 * recalculées par le moteur de règles à chaque lecture. `state` contient ce qui change en jeu.
 */
export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  speciesSlug: text("species_slug").notNull(),
  classSlug: text("class_slug").notNull(),
  backgroundSlug: text("background_slug").notNull(),
  subclassSlug: text("subclass_slug"),
  choices: jsonb("choices").notNull(),
  state: jsonb("state").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Historique des modifications d'un personnage (création, PV, repos, inventaire, niveaux…). */
export const characterHistory = pgTable(
  "character_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    summary: text("summary").notNull(),
    payload: jsonb("payload").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("character_history_character_idx").on(table.characterId, table.at)],
);

export type CharacterRow = typeof characters.$inferSelect;
export type CharacterHistoryRow = typeof characterHistory.$inferSelect;
