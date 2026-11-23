import { Module } from "@nestjs/common";
import { SrdModule } from "../srd/srd.module.js";
import { characterDatabaseProvider } from "./character-database.js";
import { CharacterLifeService } from "./character-life.service.js";
import { CharacterRollsService } from "./character-rolls.service.js";
import { CharacterReferencesService } from "./character-references.service.js";
import { CharactersController } from "./characters.controller.js";
import { CharactersService } from "./characters.service.js";
import { CreationRulesService } from "./creation-rules.service.js";
import { DraftsController } from "./drafts.controller.js";
import { DraftsService } from "./drafts.service.js";

/** Personnages : assistant de création, fiche, vie du personnage et montée de niveau. */
@Module({
  imports: [SrdModule],
  controllers: [DraftsController, CharactersController],
  providers: [
    DraftsService,
    CreationRulesService,
    CharacterReferencesService,
    CharactersService,
    CharacterRollsService,
    CharacterLifeService,
    characterDatabaseProvider,
  ],
})
export class CharactersModule {}
