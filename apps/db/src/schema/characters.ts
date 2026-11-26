import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
