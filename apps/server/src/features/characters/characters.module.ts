import { Module } from "@nestjs/common";
import { SrdModule } from "../srd/srd.module.js";
import { characterDatabaseProvider } from "./character-database.js";
import { DraftsController } from "./drafts.controller.js";
import { DraftsService } from "./drafts.service.js";

/** Personnages : assistant de création, fiche, vie du personnage et montée de niveau. */
@Module({
  imports: [SrdModule],
  controllers: [DraftsController],
  providers: [DraftsService, characterDatabaseProvider],
})
export class CharactersModule {}
