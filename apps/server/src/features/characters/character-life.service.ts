import { schema, type SrdDatabase } from "@epiquest/db";
import {
  addItem,
  applyDamage,
  changeMoney,
  type DerivedStatistics,
  deriveStatistics,
  equipItem,
  grantTemporaryHitPoints,
  heal,
  LifeRuleError,
  longRest,
  removeItem,
  type RollDie,
  shortRest,
} from "@epiquest/rules";
import {
  characterHistoryEntrySchema,
  type Character,
  type CharacterAction,
  type CharacterHistoryEntry,
  type CharacterState,
} from "@epiquest/schemas";
import {
  BadRequestException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { ROLL_DIE } from "../../shared/random/random.module.js";
import { CHARACTER_DATABASE } from "./character-database.js";
import { type CharacterReferences, toBuild, toCharacter } from "./character-builder.js";
import { CharacterReferencesService } from "./character-references.service.js";
import { CharactersService } from "./characters.service.js";
import { itemWeight } from "./srd-mapping.js";

const { characters, characterHistory } = schema;
const HISTORY_LIMIT = 50;

interface ActionOutcome {
  state: CharacterState;
  summary: string;
  details?: unknown;
}

function withHitPoints(
  state: CharacterState,
  hitPoints: { current: number; temporary: number },
): CharacterState {
  return { ...state, currentHitPoints: hitPoints.current, temporaryHitPoints: hitPoints.temporary };
}

function hitPointsOf(state: CharacterState) {
  return { current: state.currentHitPoints, temporary: state.temporaryHitPoints };
}

/** Applique une action au personnage avec les règles du moteur. Fonction pure (dé injecté). */
export function applyAction(
  state: CharacterState,
  action: CharacterAction,
  context: {
    statistics: DerivedStatistics;
    references: CharacterReferences;
    level: number;
    rollDie: RollDie;
  },
): ActionOutcome {
  const maximum = context.statistics.hitPointMaximum;
  switch (action.type) {
    case "damage":
      return {
        state: withHitPoints(state, applyDamage(hitPointsOf(state), action.amount)),
        summary: `${action.amount} dégâts subis.`,
      };
    case "heal":
      return {
        state: withHitPoints(state, heal(hitPointsOf(state), action.amount, maximum)),
        summary: `${action.amount} PV rendus.`,
      };
    case "temporary-hit-points":
      return {
        state: withHitPoints(state, grantTemporaryHitPoints(hitPointsOf(state), action.amount)),
        summary: `${action.amount} PV temporaires reçus.`,
      };
    case "short-rest": {
      const result = shortRest({
        state: { ...state, hitPoints: hitPointsOf(state) },
        hitDiceToSpend: action.hitDice,
        hitDie: context.statistics.hitDice.die,
        constitutionModifier: context.statistics.abilityModifiers.con,
        maximum,
        rollDie: context.rollDie,
      });
      const healed = result.rolls.reduce((total, roll) => total + roll.healed, 0);
      const { hitPoints, ...rest } = result.state;
      return {
        state: withHitPoints({ ...state, ...rest }, hitPoints),
        summary: `Repos court : ${action.hitDice} dés de vie dépensés, ${healed} PV rendus.`,
        details: { rolls: result.rolls },
      };
    }
    case "long-rest": {
      const { hitPoints, ...rest } = longRest(
        { ...state, hitPoints: hitPointsOf(state) },
        maximum,
        context.level,
      );
      return {
        state: withHitPoints({ ...state, ...rest }, hitPoints),
        summary: "Repos long : PV, dés de vie et sorts récupérés.",
      };
    }
    case "add-item": {
      const entry = context.references.items.get(action.slug);
      if (!entry) {
        throw new BadRequestException({
          code: "ITEM_NOT_FOUND",
          message: "Cet objet n'existe pas dans le SRD.",
        });
      }
      const item = {
        slug: entry.slug,
        name: entry.name,
        quantity: action.quantity,
        weight: itemWeight(entry.data),
      };
      return {
        state: { ...state, inventory: addItem(state.inventory, item) },
        summary: `${action.quantity} × ${entry.name} ajouté.`,
      };
    }
    case "remove-item":
      return {
        state: { ...state, inventory: removeItem(state.inventory, action.slug, action.quantity) },
        summary: `${action.quantity} × ${action.slug} retiré.`,
      };
    case "equip-item":
      return {
        state: { ...state, inventory: equipItem(state.inventory, action.slug, action.isEquipped) },
        summary: `${action.slug} ${action.isEquipped ? "équipé" : "rangé"}.`,
      };
    case "money": {
      const delta = Object.fromEntries(
        Object.entries(action.delta).filter(
          (entry): entry is [string, number] => entry[1] !== undefined,
        ),
      );
      const text = Object.entries(delta)
        .map(([coin, value]) => `${value > 0 ? "+" : ""}${value} ${coin}`)
        .join(", ");
      return {
        state: { ...state, money: changeMoney(state.money, delta) },
        summary: `Argent : ${text}.`,
      };
    }
    case "notes":
      return { state: { ...state, notes: action.notes }, summary: "Notes modifiées." };
  }
}

@Injectable()
export class CharacterLifeService {
  constructor(
    @Inject(CHARACTER_DATABASE) private readonly db: SrdDatabase,
    @Inject(ROLL_DIE) private readonly rollDie: RollDie,
    private readonly characters: CharactersService,
    private readonly references: CharacterReferencesService,
  ) {}

  /** Applique l'action, enregistre le nouvel état et l'historise dans la même transaction. */
  async act(id: string, action: CharacterAction): Promise<Character> {
    const { record, row } = await this.characters.findRecord(id);
    const references = await this.references.load(row);
    const statistics = deriveStatistics(toBuild(record, references));
    let outcome: ActionOutcome;
    try {
      outcome = applyAction(record.state, action, {
        statistics,
        references,
        level: record.level,
        rollDie: this.rollDie,
      });
    } catch (error) {
      if (error instanceof LifeRuleError) {
        throw new UnprocessableEntityException({ code: error.code, message: error.message });
      }
      throw error;
    }
    const updatedAt = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({ state: outcome.state, updatedAt })
        .where(eq(characters.id, id));
      await tx.insert(characterHistory).values({
        characterId: id,
        type: action.type,
        summary: outcome.summary,
        payload: { action, details: outcome.details ?? null },
      });
    });
    return toCharacter({ ...record, state: outcome.state, updatedAt }, references);
  }

  async history(id: string): Promise<CharacterHistoryEntry[]> {
    await this.characters.findRecord(id);
    const rows = await this.db
      .select()
      .from(characterHistory)
      .where(eq(characterHistory.characterId, id))
      .orderBy(desc(characterHistory.at))
      .limit(HISTORY_LIMIT);
    return rows.map((entry) =>
      characterHistoryEntrySchema.parse({
        id: entry.id,
        type: entry.type,
        summary: entry.summary,
        at: entry.at.toISOString(),
      }),
    );
  }
}
