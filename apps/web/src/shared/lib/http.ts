import type { z } from "zod";
import { API_URL } from "./api";

/** Erreur renvoyée par l'API au format `{ code, message, details? }`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

interface ErrorBody {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

/** Appelle l'API et valide la réponse avec son contrat partagé. */
export async function apiRequest<T extends z.ZodType>(
  schema: T,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<z.infer<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    method: init.method ?? "GET",
    headers: init.body === undefined ? {} : { "Content-Type": "application/json" },
    body: init.body === undefined ? null : JSON.stringify(init.body),
    credentials: "include",
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (payload ?? {}) as ErrorBody; // forme d'erreur uniforme du serveur (CODE-17)
    throw new ApiError(
      response.status,
      typeof error.code === "string" ? error.code : "UNKNOWN_ERROR",
      typeof error.message === "string" ? error.message : "Une erreur est survenue. Réessayez.",
      error.details,
    );
  }
  return schema.parse(payload);
}
