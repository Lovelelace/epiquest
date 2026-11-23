import type { RollDie } from "@epiquest/rules";
import { Global, Module } from "@nestjs/common";
import { randomInt } from "node:crypto";

/** Jeton d'injection du tirage de dés : `@Inject(ROLL_DIE) private readonly rollDie: RollDie`. */
export const ROLL_DIE = Symbol("ROLL_DIE");

/**
 * Tirage d'un dé côté serveur avec un générateur cryptographiquement sûr (SEC-02).
 * TODO(#26): passer par l'évaluation du moteur de dés quand elle sera disponible.
 */
export const cryptoRollDie: RollDie = (sides) => randomInt(1, sides + 1);

@Global()
@Module({
  providers: [{ provide: ROLL_DIE, useValue: cryptoRollDie }],
  exports: [ROLL_DIE],
})
export class RandomModule {}
