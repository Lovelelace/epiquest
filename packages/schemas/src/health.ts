import { z } from "zod";

/** Réponse de la route GET /health du serveur. */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
