import {
  characterDraftSchema,
  characterHistoryEntrySchema,
  characterRollSchema,
  characterSchema,
  creationOptionsSchema,
  creationPreviewSchema,
  srdDetailExtension,
  srdPageSchema,
  srdSummarySchemas,
  type Character,
  type CharacterAction,
  type CharacterDraft,
  type CharacterHistoryEntry,
  type CharacterRoll,
  type CharacterRollRequest,
  type CharacterDraftUpdate,
  type CreationOptions,
  type CreationPreview,
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

export function rollAbilities(id: string): Promise<CharacterDraft> {
  return apiRequest(characterDraftSchema, `/character-drafts/${id}/ability-rolls`, {
    method: "POST",
  });
}

export function getCreationOptions(id: string): Promise<CreationOptions> {
  return apiRequest(creationOptionsSchema, `/character-drafts/${id}/options`);
}

export function getCreationPreview(id: string): Promise<CreationPreview> {
  return apiRequest(creationPreviewSchema, `/character-drafts/${id}/preview`);
}

export function createCharacter(draftId: string): Promise<Character> {
  return apiRequest(characterSchema, `/character-drafts/${draftId}/character`, { method: "POST" });
}

export function getCharacter(id: string): Promise<Character> {
  return apiRequest(characterSchema, `/characters/${id}`);
}

export function rollFromSheet(
  characterId: string,
  request: CharacterRollRequest,
): Promise<CharacterRoll> {
  return apiRequest(characterRollSchema, `/characters/${characterId}/rolls`, {
    method: "POST",
    body: request,
  });
}

export function getRecentRolls(characterId: string): Promise<CharacterRoll[]> {
  return apiRequest(characterRollSchema.array(), `/characters/${characterId}/rolls`);
}

export function actOnCharacter(characterId: string, action: CharacterAction): Promise<Character> {
  return apiRequest(characterSchema, `/characters/${characterId}/actions`, {
    method: "POST",
    body: action,
  });
}

export function getHistory(characterId: string): Promise<CharacterHistoryEntry[]> {
  return apiRequest(characterHistoryEntrySchema.array(), `/characters/${characterId}/history`);
}

/** Recherche d'équipement du SRD par nom (anglais). */
export async function searchItems(query: string): Promise<SrdOption[]> {
  const params = new URLSearchParams({ q: query, kind: "equipment", pageSize: "10" });
  const page = await apiRequest(
    srdPageSchema(srdSummarySchemas.items),
    `/srd/items?${params.toString()}`,
  );
  return page.items;
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
