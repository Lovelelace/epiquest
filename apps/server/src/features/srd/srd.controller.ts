import {
  srdEntitySchema,
  srdFilterSchemas,
  srdListQuerySchema,
  type SrdDetail,
  type SrdEntity,
  type SrdPage,
  type SrdSummary,
  type SrdVersion,
} from "@epiquest/schemas";
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { SrdService } from "./srd.service.js";

/** Valide une entrée externe ; une donnée invalide est refusée avec le détail (DATA-05, DATA-06). */
function parseOrReject<T extends z.ZodType>(zodSchema: T, value: unknown): z.infer<T> {
  const result = zodSchema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException({
      code: "INVALID_QUERY",
      message: "Paramètres de recherche invalides.",
      details: z.flattenError(result.error).fieldErrors,
    });
  }
  return result.data;
}

function parseEntity(entity: string): SrdEntity {
  const result = srdEntitySchema.safeParse(entity);
  if (!result.success) {
    throw new NotFoundException({
      code: "SRD_ENTITY_NOT_FOUND",
      message: `Entité inconnue : « ${entity} ».`,
    });
  }
  return result.data;
}

/** Consultation du SRD : lecture seule, données publiques. */
@Controller("srd")
export class SrdController {
  constructor(private readonly srd: SrdService) {}

  @Get("version")
  version(): Promise<SrdVersion> {
    return this.srd.version();
  }

  @Get(":entity")
  list(
    @Param("entity") entityParam: string,
    @Query() rawQuery: Record<string, unknown>,
  ): Promise<SrdPage<SrdSummary<SrdEntity>>> {
    const entity = parseEntity(entityParam);
    const query = parseOrReject(srdListQuerySchema, rawQuery);
    const filters = parseOrReject(srdFilterSchemas[entity], rawQuery);
    return this.srd.list(entity, query, filters);
  }

  @Get(":entity/:slug")
  get(
    @Param("entity") entityParam: string,
    @Param("slug") slug: string,
  ): Promise<SrdDetail<SrdEntity>> {
    return this.srd.get(parseEntity(entityParam), slug);
  }
}
