import {
  characterDraftUpdateSchema,
  creationOptionsSchema,
  type CharacterDraft,
  type CreationOptions,
} from "@epiquest/schemas";
import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { parseOrReject } from "../../shared/validation/parse-or-reject.js";
import { CreationRulesService } from "./creation-rules.service.js";
import { DraftsService } from "./drafts.service.js";

// TODO(#27): vérifier que le brouillon appartient à l'utilisateur quand l'authentification existera (SEC-07).
/** Brouillons de l'assistant de création, sauvegardés à chaque étape. */
@Controller("character-drafts")
export class DraftsController {
  constructor(
    private readonly drafts: DraftsService,
    private readonly creationRules: CreationRulesService,
  ) {}

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

  /** Tirage des caractéristiques (4d6, garder les 3 meilleurs), une seule fois par brouillon. */
  @Post(":id/ability-rolls")
  @HttpCode(201)
  rollAbilities(@Param("id", ParseUUIDPipe) id: string): Promise<CharacterDraft> {
    return this.drafts.rollAbilities(id);
  }

  /** Ce que l'origine choisie autorise : bonus, compétences, sous-classes, sorts, équipement. */
  @Get(":id/options")
  async options(@Param("id", ParseUUIDPipe) id: string): Promise<CreationOptions> {
    const draft = await this.drafts.get(id);
    const { options } = await this.creationRules.resolve(draft.choices);
    return creationOptionsSchema.parse(options);
  }
}
