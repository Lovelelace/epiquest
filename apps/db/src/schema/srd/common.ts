import { sql, type SQL } from "drizzle-orm";
import { customType, jsonb, pgEnum, text, uuid } from "drizzle-orm/pg-core";

/** Type PostgreSQL `tsvector`, utilisé pour la recherche plein texte. */
const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

/** Tailles de créature du SRD, communes aux espèces et aux monstres. */
export const srdSize = pgEnum("srd_size", [
  "tiny",
  "small",
  "medium",
  "large",
  "huge",
  "gargantuan",
]);

/**
 * Colonnes partagées par toutes les entités du SRD.
 *
 * - `slug` : identifiant stable de l'entrée dans la source (« acid-arrow »). Il sert de clé
 *   naturelle à l'import, qui peut ainsi être rejoué sans doublon (DATA-14).
 * - `raw` : l'entrée source complète, conservée pour ne rien perdre de ce qui n'a pas de colonne.
 * - `search` : vecteur de recherche calculé par PostgreSQL à partir du nom et de la description.
 *
 * Une fonction plutôt qu'un objet : chaque table reçoit ses propres instances de colonnes.
 * Le type de retour est déduit, car les types des colonnes Drizzle sont trop verbeux à écrire.
 */
export function srdColumns() {
  return {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    raw: jsonb("raw").notNull(),
    search: tsvector("search")
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')`,
      ),
  };
}
