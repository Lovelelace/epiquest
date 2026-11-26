import { schema, type SrdDatabase } from "@epiquest/db";
import {
  ABILITY_LABELS,
  isSkill,
  rollCheck,
  SKILL_LABELS,
  rollDamage,
  type RollDie,
  type RollResult,
} from "@epiquest/rules";
import {
  abilitySchema,
  characterRollSchema,
  type Character,
  type CharacterRoll,
  type CharacterRollRequest,
} from "@epiquest/schemas";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ROLL_DIE } from "../../shared/random/random.module.js";
import { CHARACTER_DATABASE } from "./character-database.js";
import { CharactersService } from "./characters.service.js";
import { rollForViewer } from "./roll-visibility.js";

const { characterRolls } = schema;
const RECENT_ROLLS = 20;

function unknownKey(kind: string): never {
  throw new BadRequestException({
    code: "INVALID_ROLL",
    message: `Ce jet de ${kind} n'existe pas sur la fiche.`,
  });
}

/** Le serveur calcule le modificateur depuis la fiche : le client n'envoie qu'une intention (SEC-03). */
function computeRoll(
  character: Character,
  request: CharacterRollRequest,
  rollDie: RollDie,
): { label: string; result: RollResult } {
  const { statistics } = character;
  switch (request.kind) {
    case "ability":
    case "save": {
      const ability = abilitySchema.safeParse(request.key);
      if (!ability.success)
        return unknownKey(request.kind === "save" ? "sauvegarde" : "caractéristique");
      const name = ABILITY_LABELS[ability.data];
      return request.kind === "save"
        ? {
            label: `Sauvegarde de ${name}`,
            result: rollCheck(rollDie, statistics.savingThrows[ability.data].modifier),
          }
        : {
            label: `Test de ${name}`,
            result: rollCheck(rollDie, statistics.abilityModifiers[ability.data]),
          };
    }
    case "skill": {
      if (!request.key || !isSkill(request.key)) return unknownKey("compétence");
      return {
        label: SKILL_LABELS[request.key],
        result: rollCheck(rollDie, statistics.skills[request.key].modifier),
      };
    }
    case "initiative":
      return { label: "Initiative", result: rollCheck(rollDie, statistics.initiative) };
    case "attack":
    case "damage": {
      const attack = character.attacks.find((item) => item.slug === request.key);
      if (!attack) return unknownKey("attaque");
      if (request.kind === "attack")
        return {
          label: `Attaque : ${attack.name}`,
          result: rollCheck(rollDie, attack.attackBonus),
        };
      const [dice = "", sign = "+", value = "0"] = attack.damage.split(" ");
      const modifier = (sign === "-" ? -1 : 1) * Number(value);
      return { label: `Dégâts : ${attack.name}`, result: rollDamage(rollDie, dice, modifier) };
    }
  }
}

const storedDiceSchema = z.array(z.object({ sides: z.number().int(), value: z.number().int() }));

type RollRow = typeof characterRolls.$inferSelect;

function toRoll(row: RollRow): CharacterRoll {
  return characterRollSchema.parse({
    id: row.id,
    label: row.label,
    expression: row.expression,
    dice: storedDiceSchema.parse(row.dice),
    modifier: row.modifier,
    total: row.total,
    visibility: row.visibility,
    rolledAt: row.rolledAt.toISOString(),
  });
}

@Injectable()
export class CharacterRollsService {
  constructor(
    @Inject(CHARACTER_DATABASE) private readonly db: SrdDatabase,
    @Inject(ROLL_DIE) private readonly rollDie: RollDie,
    private readonly characters: CharactersService,
  ) {}

  // TODO(#27): déterminer le destinataire (joueur, MJ) depuis la session quand l'authentification existera.
  /** Lance le jet demandé, l'enregistre et le renvoie tel que le joueur doit le voir. */
  async roll(characterId: string, request: CharacterRollRequest): Promise<CharacterRoll | null> {
    const character = await this.characters.get(characterId);
    const { label, result } = computeRoll(character, request, this.rollDie);
    const [row] = await this.db
      .insert(characterRolls)
      .values({ characterId, label, ...result, visibility: request.visibility })
      .returning();
    if (!row) throw new Error("Jet enregistré sans ligne renvoyée");
    return rollForViewer(toRoll(row), "owner");
  }

  /** Derniers jets du personnage, filtrés pour le joueur. */
  async recent(characterId: string): Promise<CharacterRoll[]> {
    await this.characters.findRecord(characterId);
    const rows = await this.db
      .select()
      .from(characterRolls)
      .where(eq(characterRolls.characterId, characterId))
      .orderBy(desc(characterRolls.rolledAt))
      .limit(RECENT_ROLLS);
    return rows.flatMap((row) => {
      const roll = rollForViewer(toRoll(row), "owner");
      return roll ? [roll] : [];
    });
  }
}
