import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

/**
 * Valide une entrée externe avec son contrat ; une donnée invalide est refusée avec le détail
 * au format uniforme `{ code, message, details }` (DATA-05, DATA-06, CODE-17).
 */
export function parseOrReject<T extends z.ZodType>(
  schema: T,
  value: unknown,
  message = "Données invalides.",
): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException({
      code: "INVALID_INPUT",
      message,
      details: z.flattenError(result.error).fieldErrors,
    });
  }
  return result.data;
}
