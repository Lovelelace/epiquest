"use client";

import type { Character, CharacterDraft, CreationPreview, DraftChoices } from "@epiquest/schemas";
import { useEffect, useState } from "react";
import { ApiError } from "@/shared/lib/http";
import { createCharacter, getCreationPreview } from "../api";
import { useCreationOptions } from "../use-creation-options";
import { StatisticsSummary } from "./StatisticsSummary";

interface SummaryStepProps {
  draft: CharacterDraft;
  update: (choices: Partial<DraftChoices>) => void;
  onCreated: (character: Character) => void;
}

/** Récapitulatif : nom, sous-classe éventuelle, statistiques du moteur et création. */
export function SummaryStep({ draft, update, onCreated }: SummaryStepProps) {
  const { options } = useCreationOptions(draft.id, "summary");
  const [preview, setPreview] = useState<CreationPreview | null>(null);
  const [name, setName] = useState(draft.choices.name ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    getCreationPreview(draft.id)
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [draft.id, draft.updatedAt]);

  async function create() {
    setSubmitError(null);
    try {
      onCreated(await createCharacter(draft.id));
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "La création a échoué. Réessayez.",
      );
      setPreview(await getCreationPreview(draft.id).catch(() => null));
    }
  }

  const needsSubclass = options !== null && options.subclass.level <= 1;
  const violations = preview?.violations ?? [];
  return (
    <div className="grid gap-6">
      <div>
        <label htmlFor="character-name" className="block font-semibold">
          Nom du personnage
        </label>
        <input
          id="character-name"
          value={name}
          maxLength={80}
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
          onBlur={() => update({ name: name.trim() || null })}
          className="mt-1 w-full max-w-md rounded border border-slate-500 px-2 py-1"
        />
      </div>
      {needsSubclass && (
        <div>
          <label htmlFor="character-subclass" className="block font-semibold">
            Sous-classe
          </label>
          <select
            id="character-subclass"
            value={draft.choices.subclass ?? ""}
            onChange={(event) => update({ subclass: event.target.value || null })}
            className="mt-1 rounded border border-slate-500 px-2 py-1"
          >
            <option value="">À choisir</option>
            {options.subclass.options.map((subclass) => (
              <option key={subclass.slug} value={subclass.slug} lang="en">
                {subclass.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {violations.length > 0 && (
        <section aria-labelledby="violations-title" className="rounded border border-red-700 p-3">
          <h3 id="violations-title" className="font-semibold text-red-800">
            À corriger avant de créer le personnage
          </h3>
          <ul className="list-disc pl-6">
            {violations.map((item) => (
              <li key={`${item.code}-${item.path}`}>{item.message}</li>
            ))}
          </ul>
        </section>
      )}
      {preview?.statistics && <StatisticsSummary statistics={preview.statistics} />}
      <div>
        <button
          type="button"
          className="rounded bg-blue-800 px-4 py-2 text-white"
          onClick={() => void create()}
        >
          Créer le personnage
        </button>
        {submitError && (
          <p role="alert" className="mt-2 text-red-800">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}
