import { schema, type SrdDatabase } from "@epiquest/db";
import {
  characterDraftSchema,
  draftChoicesSchema,
  EMPTY_DRAFT_CHOICES,
  type CharacterDraft,
  type CharacterDraftUpdate,
  type DraftChoices,
} from "@epiquest/schemas";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { SrdService } from "../srd/srd.service.js";
import { CHARACTER_DATABASE } from "./character-database.js";

const { characterDrafts } = schema;

type DraftChoicesUpdate = NonNullable<CharacterDraftUpdate["choices"]>;

/** Choix qui dépendent d'un autre choix : ils sont effacés quand celui-ci change. */
const DEPENDENT_CHOICES: Partial<Record<keyof DraftChoices, (keyof DraftChoices)[]>> = {
  species: ["chosenSkills", "expertise"],
  background: ["chosenSkills", "expertise"],
  class: ["chosenSkills", "expertise", "subclass", "cantrips", "spells", "equipment"],
  abilityMethod: ["baseAbilityScores"],
};

/** Applique une mise à jour partielle et efface les choix devenus incohérents. */
export function mergeChoices(current: DraftChoices, update: DraftChoicesUpdate): DraftChoices {
  // Les clés absentes de la mise à jour gardent leur valeur ; zod n'ajoute pas de clé indéfinie.
  const merged = { ...current, ...update } as DraftChoices;
  for (const [key, dependents] of Object.entries(DEPENDENT_CHOICES)) {
    const field = key as keyof DraftChoices; // clés de DEPENDENT_CHOICES, typées ci-dessus
    if (field in update && update[field] !== current[field]) {
      for (const dependent of dependents ?? []) {
        if (!(dependent in update))
          Object.assign(merged, { [dependent]: EMPTY_DRAFT_CHOICES[dependent] });
      }
    }
  }
  return merged;
}

type DraftRow = typeof characterDrafts.$inferSelect;

function toDraft(row: DraftRow): CharacterDraft {
  // Le contrat valide aussi ce qui sort de la base.
  return characterDraftSchema.parse({
    id: row.id,
    step: row.step,
    choices: row.choices,
    abilityRolls: row.abilityRolls,
    updatedAt: row.updatedAt.toISOString(),
  });
}

@Injectable()
export class DraftsService {
  constructor(
    @Inject(CHARACTER_DATABASE) private readonly db: SrdDatabase,
    private readonly srd: SrdService,
  ) {}

  async create(): Promise<CharacterDraft> {
    const [row] = await this.db
      .insert(characterDrafts)
      .values({ choices: EMPTY_DRAFT_CHOICES })
      .returning();
    if (!row) throw new Error("Création du brouillon sans ligne renvoyée");
    return toDraft(row);
  }

  async get(id: string): Promise<CharacterDraft> {
    const [row] = await this.db.select().from(characterDrafts).where(eq(characterDrafts.id, id));
    if (!row) {
      throw new NotFoundException({
        code: "DRAFT_NOT_FOUND",
        message: "Ce brouillon n'existe pas.",
      });
    }
    return toDraft(row);
  }

  /** Vérifie que les entrées du SRD choisies existent (404 sinon). */
  private async checkReferences(update: DraftChoicesUpdate): Promise<void> {
    if (update.species) await this.srd.get("species", update.species);
    if (update.class) await this.srd.get("classes", update.class);
    if (update.background) await this.srd.get("backgrounds", update.background);
  }

  async update(id: string, update: CharacterDraftUpdate): Promise<CharacterDraft> {
    const current = await this.get(id);
    const choicesUpdate = update.choices ?? {};
    await this.checkReferences(choicesUpdate);
    const choices = draftChoicesSchema.parse(mergeChoices(current.choices, choicesUpdate));
    const [row] = await this.db
      .update(characterDrafts)
      .set({
        choices,
        step: update.step ?? current.step,
        ...(choicesUpdate.abilityMethod !== undefined &&
        choicesUpdate.abilityMethod !== current.choices.abilityMethod
          ? { abilityRolls: null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(characterDrafts.id, id))
      .returning();
    if (!row)
      throw new NotFoundException({
        code: "DRAFT_NOT_FOUND",
        message: "Ce brouillon n'existe pas.",
      });
    return toDraft(row);
  }
}
