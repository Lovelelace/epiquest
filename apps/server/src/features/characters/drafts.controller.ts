import { characterDraftUpdateSchema, type CharacterDraft } from "@epiquest/schemas";
import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { parseOrReject } from "../../shared/validation/parse-or-reject.js";
import { DraftsService } from "./drafts.service.js";

// TODO(#27): vérifier que le brouillon appartient à l'utilisateur quand l'authentification existera (SEC-07).
/** Brouillons de l'assistant de création, sauvegardés à chaque étape. */
@Controller("character-drafts")
export class DraftsController {
  constructor(private readonly drafts: DraftsService) {}

  @Post()
  @HttpCode(201)
  create(): Promise<CharacterDraft> {
    return this.drafts.create();
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string): Promise<CharacterDraft> {
    return this.drafts.get(id);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown): Promise<CharacterDraft> {
    return this.drafts.update(
      id,
      parseOrReject(characterDraftUpdateSchema, body, "Brouillon invalide."),
    );
  }
}
