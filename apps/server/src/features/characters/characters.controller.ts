import type { Character, CreationPreview } from "@epiquest/schemas";
import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CharactersService } from "./characters.service.js";

// TODO(#27): vérifier la propriété du personnage quand l'authentification existera (SEC-07).
@Controller()
export class CharactersController {
  constructor(private readonly characters: CharactersService) {}

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
}
