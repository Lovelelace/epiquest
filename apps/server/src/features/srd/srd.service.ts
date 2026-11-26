import { getImportedSrdVersion, type DatabaseConnection, type SrdDatabase } from "@epiquest/db";
import {
  srdDetailExtension,
  srdPageSchema,
  srdSummarySchemas,
  srdVersionSchema,
  type SrdDetail,
  type SrdEntity,
  type SrdFilters,
  type SrdListQuery,
  type SrdPage,
  type SrdSummary,
  type SrdVersion,
} from "@epiquest/schemas";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { DATABASE } from "../../shared/database/database.module.js";
import { SRD_ENTITIES } from "./srd-entities.js";

/** Jeton d'injection de la base utilisée par la consultation du SRD (remplacée dans les tests). */
export const SRD_DATABASE = Symbol("SRD_DATABASE");

export const srdDatabaseProvider = {
  provide: SRD_DATABASE,
  inject: [DATABASE],
  useFactory: (connection: DatabaseConnection): SrdDatabase => connection.db,
};

/** Échappe les caractères spéciaux de LIKE pour une recherche par préfixe. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}

@Injectable()
export class SrdService {
  constructor(@Inject(SRD_DATABASE) private readonly db: SrdDatabase) {}

  /** Liste paginée, filtrée et éventuellement triée par pertinence de la recherche. */
  async list<E extends SrdEntity>(
    entity: E,
    query: SrdListQuery,
    filters: SrdFilters<E>,
  ): Promise<SrdPage<SrdSummary<E>>> {
    const config = SRD_ENTITIES[entity];
    const { table } = config;
    const textQuery = query.q ? sql`websearch_to_tsquery('english', ${query.q})` : undefined;
    const where = and(
      textQuery
        ? or(
            sql`${table.search} @@ ${textQuery}`,
            ilike(table.name, `${escapeLike(query.q ?? "")}%`),
          )
        : undefined,
      ...config.filters(filters),
    );
    const order: SQL[] = textQuery
      ? [desc(sql`ts_rank(${table.search}, ${textQuery})`), asc(table.name)]
      : [asc(table.name)];

    const [rows, [totals]] = await Promise.all([
      this.db
        .select({ id: table.id, slug: table.slug, name: table.name, ...config.summary })
        .from(table)
        .where(where)
        .orderBy(...order)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db.select({ total: count() }).from(table).where(where),
    ]);

    // La réponse est validée par le contrat partagé avant d'être envoyée (DATA-05).
    const page = srdPageSchema(srdSummarySchemas[entity]).parse({
      items: rows,
      page: query.page,
      pageSize: query.pageSize,
      total: totals?.total ?? 0,
    });
    // zod renvoie le type de l'union des entités : on le restreint à l'entité demandée.
    return page as SrdPage<SrdSummary<E>>;
  }

  /** Détail d'une entrée par son slug. */
  async get<E extends SrdEntity>(entity: E, slug: string): Promise<SrdDetail<E>> {
    const { table, summary } = SRD_ENTITIES[entity];
    const [row] = await this.db
      .select({
        id: table.id,
        slug: table.slug,
        name: table.name,
        ...summary,
        description: table.description,
        data: table.raw,
      })
      .from(table)
      .where(eq(table.slug, slug))
      .limit(1);
    if (!row) {
      throw new NotFoundException({
        code: "SRD_ENTRY_NOT_FOUND",
        message: `Aucune entrée « ${slug} » dans ${entity}.`,
      });
    }
    // Même restriction de type que pour les listes.
    return srdSummarySchemas[entity].extend(srdDetailExtension).parse(row) as SrdDetail<E>;
  }

  /** Version du SRD importée, ou 404 si l'import n'a jamais été lancé. */
  async version(): Promise<SrdVersion> {
    const imported = await getImportedSrdVersion(this.db);
    if (!imported) {
      throw new NotFoundException({
        code: "SRD_NOT_IMPORTED",
        message: "Le SRD n'a pas encore été importé dans la base.",
      });
    }
    return srdVersionSchema.parse({ ...imported, importedAt: imported.importedAt.toISOString() });
  }
}
