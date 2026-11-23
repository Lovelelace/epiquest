import {
  characterDraftSchema,
  srdDetailExtension,
  srdPageSchema,
  srdSummarySchemas,
  type CharacterDraft,
  type CharacterDraftUpdate,
} from "@epiquest/schemas";
import { apiRequest } from "@/shared/lib/http";

export type OriginEntity = "species" | "classes" | "backgrounds";

export interface SrdOption {
  slug: string;
  name: string;
}

export interface SrdOptionDetail extends SrdOption {
  description: string;
  data: Record<string, unknown>;
}

export function createDraft(): Promise<CharacterDraft> {
  return apiRequest(characterDraftSchema, "/character-drafts", { method: "POST" });
}

export function getDraft(id: string): Promise<CharacterDraft> {
  return apiRequest(characterDraftSchema, `/character-drafts/${id}`);
}

export function updateDraft(id: string, update: CharacterDraftUpdate): Promise<CharacterDraft> {
  return apiRequest(characterDraftSchema, `/character-drafts/${id}`, {
    method: "PATCH",
    body: update,
  });
}

/** Toutes les options d'une entité du SRD (au plus une page de 100, suffisant pour les origines). */
export async function listOptions(entity: OriginEntity): Promise<SrdOption[]> {
  const page = await apiRequest(
    srdPageSchema(srdSummarySchemas[entity]),
    `/srd/${entity}?pageSize=100`,
  );
  return page.items;
}

export function getOption(entity: OriginEntity, slug: string): Promise<SrdOptionDetail> {
  return apiRequest(srdSummarySchemas[entity].extend(srdDetailExtension), `/srd/${entity}/${slug}`);
}
