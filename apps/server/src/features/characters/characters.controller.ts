import {
  characterRollRequestSchema,
  type Character,
  type CharacterRoll,
  type CreationPreview,
} from "@epiquest/schemas";
import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { parseOrReject } from "../../shared/validation/parse-or-reject.js";
import { CharacterRollsService } from "./character-rolls.service.js";
import { CharactersService } from "./characters.service.js";

// TODO(#27): vérifier la propriété du personnage quand l'authentification existera (SEC-07).
@Controller()
export class CharactersController {
  constructor(
    private readonly characters: CharactersService,
    private readonly rolls: CharacterRollsService,
  ) {}

  /** Récapitulatif avant création : erreurs restantes et statistiques calculées. */
  @Get("character-drafts/:id/preview")
  preview(@Param("id", ParseUUIDPipe) id: string): Promise<CreationPreview> {
    return this.characters.preview(id);
  }

  /** Crée le personnage à partir du brouillon ; refusé (422) si une règle n'est pas respectée. */
  @Post("character-drafts/:id/character")
  @HttpCode(201)
  create(@Param("id", ParseUUIDPipe) id: string): Promise<Character> {
    return this.characters.createFromDraft(id);
  }

  @Get("characters/:id")
  get(@Param("id", ParseUUIDPipe) id: string): Promise<Character> {
    return this.characters.get(id);
  }

  /** Jet depuis la fiche : le client envoie le type de jet, le serveur tire et calcule. */
  @Post("characters/:id/rolls")
  @HttpCode(201)
  async roll(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ): Promise<CharacterRoll> {
    const roll = await this.rolls.roll(
      id,
      parseOrReject(characterRollRequestSchema, body, "Jet invalide."),
    );
    if (!roll) throw new Error("Le lanceur d'un jet le reçoit toujours");
    return roll;
  }

  @Get("characters/:id/rolls")
  recentRolls(@Param("id", ParseUUIDPipe) id: string): Promise<CharacterRoll[]> {
    return this.rolls.recent(id);
  }
}
