import {
  characterActionSchema,
  characterRollRequestSchema,
  type Character,
  type CharacterHistoryEntry,
  type CharacterRoll,
  type CreationPreview,
  levelUpRequestSchema,
  type LevelUpOptions,
} from "@epiquest/schemas";
import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { parseOrReject } from "../../shared/validation/parse-or-reject.js";
import { CharacterLevelUpService } from "./character-level-up.service.js";
import { CharacterLifeService } from "./character-life.service.js";
import { CharacterRollsService } from "./character-rolls.service.js";
import { CharactersService } from "./characters.service.js";

// TODO(#27): vérifier la propriété du personnage quand l'authentification existera (SEC-07).
@Controller()
export class CharactersController {
  constructor(
    private readonly characters: CharactersService,
    private readonly rolls: CharacterRollsService,
    private readonly life: CharacterLifeService,
    private readonly levelUps: CharacterLevelUpService,
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

  /** Vie du personnage : PV, repos, inventaire, argent, notes. Chaque action est historisée. */
  @Post("characters/:id/actions")
  @HttpCode(200)
  act(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown): Promise<Character> {
    return this.life.act(id, parseOrReject(characterActionSchema, body, "Action invalide."));
  }

  @Get("characters/:id/history")
  history(@Param("id", ParseUUIDPipe) id: string): Promise<CharacterHistoryEntry[]> {
    return this.life.history(id);
  }

  /** Gains et choix du niveau suivant ; 422 au niveau maximal. */
  @Get("characters/:id/level-up")
  levelUpOptions(@Param("id", ParseUUIDPipe) id: string): Promise<LevelUpOptions> {
    return this.levelUps.options(id);
  }

  /** Passe au niveau suivant ; le serveur valide les choix et tire le dé de vie. */
  @Post("characters/:id/level-up")
  @HttpCode(200)
  levelUp(@Param("id", ParseUUIDPipe) id: string, @Body() body: unknown): Promise<Character> {
    return this.levelUps.levelUp(
      id,
      parseOrReject(levelUpRequestSchema, body, "Montée de niveau invalide."),
    );
  }
}
