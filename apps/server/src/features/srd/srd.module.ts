import { Module } from "@nestjs/common";
import { SrdController } from "./srd.controller.js";
import { SrdService, srdDatabaseProvider } from "./srd.service.js";

/** Consultation des données du SRD importées en base. */
@Module({
  controllers: [SrdController],
  providers: [SrdService, srdDatabaseProvider],
  exports: [SrdService],
})
export class SrdModule {}
