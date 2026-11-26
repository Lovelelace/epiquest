"use client";

import type { CharacterDraft, DraftChoices } from "@epiquest/schemas";
import { useCreationOptions } from "../use-creation-options";

interface EquipmentStepProps {
  draft: CharacterDraft;
  update: (choices: Partial<DraftChoices>) => void;
}

/** Étape de l'équipement de départ : l'équipement fixe, puis une option par groupe de choix. */
export function EquipmentStep({ draft, update }: EquipmentStepProps) {
  const { options, error } = useCreationOptions(draft.id, "equipment");
  if (error) return <p role="alert">{error}</p>;
  if (!options) return <p>Chargement de l&apos;équipement…</p>;
  const selected = draft.choices.equipment;

  function choose(group: number, option: number) {
    const next = options ? options.equipmentChoices.map((_, index) => selected[index] ?? 0) : [];
    next[group] = option;
    update({ equipment: next });
  }

  return (
    <div className="grid gap-6">
      <section aria-labelledby="fixed-equipment">
        <h3 id="fixed-equipment" className="text-lg font-semibold">
          Équipement fourni
        </h3>
        <ul lang="en" className="list-disc pl-6">
          {options.fixedEquipment.map((item) => (
            <li key={item.slug}>
              {item.quantity} × {item.name}
            </li>
          ))}
        </ul>
      </section>
      {options.equipmentChoices.map((choice, group) => (
        <fieldset key={choice.description}>
          <legend className="font-semibold">
            Choix {group + 1} : <span lang="en">{choice.description}</span>
          </legend>
          <ul className="mt-1 grid gap-1 sm:grid-cols-2">
            {choice.options.map((option, index) => (
              <li key={option.label}>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`equipment-${group}`}
                    checked={
                      selected.length === options.equipmentChoices.length &&
                      selected[group] === index
                    }
                    onChange={() => choose(group, index)}
                  />
                  <span lang="en">{option.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}
    </div>
  );
}
