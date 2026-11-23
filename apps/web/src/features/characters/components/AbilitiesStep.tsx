"use client";

import { ABILITIES, type Ability, POINT_BUY_BUDGET } from "@epiquest/rules";
import type {
  AbilityMethod,
  CharacterDraft,
  CreationOptions,
  DraftChoices,
} from "@epiquest/schemas";
import { useEffect, useState } from "react";
import { getCreationOptions } from "../api";
import {
  ABILITY_NAMES,
  availableValues,
  EMPTY_SCORES,
  formatModifier,
  isComplete,
  isValidAssignment,
  METHOD_NAMES,
  originBonus,
  type PartialScores,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  POINT_BUY_START,
  pointsLeft,
  remainingValues,
} from "../abilities";

interface AbilitiesStepProps {
  draft: CharacterDraft;
  update: (choices: Partial<DraftChoices>) => void;
  roll: () => void;
}

const METHODS: AbilityMethod[] = ["point-buy", "standard-array", "rolled"];

function initialScores(draft: CharacterDraft): PartialScores {
  if (draft.choices.baseAbilityScores) return draft.choices.baseAbilityScores;
  return draft.choices.abilityMethod === "point-buy" ? POINT_BUY_START : EMPTY_SCORES;
}

/** Étape des caractéristiques : achat de points, tableau standard ou 4d6 tiré par le serveur. */
export function AbilitiesStep({ draft, update, roll }: AbilitiesStepProps) {
  const method = draft.choices.abilityMethod;
  const [scores, setScores] = useState<PartialScores>(() => initialScores(draft));
  const [options, setOptions] = useState<CreationOptions | null>(null);

  useEffect(() => {
    getCreationOptions(draft.id)
      .then(setOptions)
      .catch(() => setOptions(null));
  }, [draft.id]);

  function chooseMethod(next: AbilityMethod) {
    setScores(next === "point-buy" ? POINT_BUY_START : EMPTY_SCORES);
    update({ abilityMethod: next });
  }

  function setScore(ability: Ability, value: number | null) {
    const next = { ...scores, [ability]: value };
    setScores(next);
    if (method && isComplete(next) && isValidAssignment(method, draft, next)) {
      update({ baseAbilityScores: next });
    } else if (draft.choices.baseAbilityScores !== null) {
      // Une répartition invalide n'est pas enregistrée : l'étape suivante reste bloquée.
      update({ baseAbilityScores: null });
    }
  }

  const left = method === "point-buy" ? pointsLeft(scores) : null;
  const values = method ? availableValues(method, draft) : [];
  const remaining = remainingValues(values, scores);

  return (
    <div className="grid gap-6">
      <fieldset>
        <legend className="text-lg font-semibold">Méthode</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {METHODS.map((item) => (
            <label key={item} className="flex items-center gap-2">
              <input
                type="radio"
                name="ability-method"
                value={item}
                checked={method === item}
                onChange={() => chooseMethod(item)}
              />
              {METHOD_NAMES[item]}
            </label>
          ))}
        </div>
      </fieldset>

      {method === "rolled" && !draft.abilityRolls && (
        <div>
          <p>
            Le serveur tire six fois 4d6 et garde les 3 meilleurs dés. Un seul tirage par
            personnage.
          </p>
          <button
            type="button"
            className="mt-2 rounded bg-blue-800 px-4 py-2 text-white"
            onClick={roll}
          >
            Lancer les dés
          </button>
        </div>
      )}
      {method === "rolled" && draft.abilityRolls && (
        <section aria-labelledby="rolls-title">
          <h3 id="rolls-title" className="font-semibold">
            Tirages du serveur
          </h3>
          <ol className="mt-1 list-decimal pl-6">
            {draft.abilityRolls.map((item, index) => (
              <li key={index}>
                Dés {item.dice.join(", ")} : total {item.total}
              </li>
            ))}
          </ol>
        </section>
      )}

      {method === "point-buy" && (
        <p role="status" className="font-medium">
          {left === null
            ? "Chaque valeur doit être comprise entre 8 et 15."
            : left >= 0
              ? `Points restants : ${left} sur ${POINT_BUY_BUDGET}.`
              : `Budget dépassé de ${-left} points.`}
        </p>
      )}
      {(method === "standard-array" || (method === "rolled" && draft.abilityRolls)) && (
        <p role="status">
          {remaining.length > 0
            ? `Valeurs à répartir : ${remaining.join(", ")}.`
            : "Toutes les valeurs sont réparties."}
        </p>
      )}

      {method && (method !== "rolled" || draft.abilityRolls) && (
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Répartition des caractéristiques</caption>
          <thead>
            <tr>
              <th scope="col">Caractéristique</th>
              <th scope="col">Valeur de base</th>
              <th scope="col">Bonus d&apos;espèce</th>
              <th scope="col">Valeur finale</th>
              <th scope="col">Modificateur</th>
            </tr>
          </thead>
          <tbody>
            {ABILITIES.map((ability) => {
              const base = scores[ability];
              const bonus = originBonus(options, ability);
              const final = base === null ? null : base + bonus;
              const inputId = `ability-${ability}`;
              return (
                <tr key={ability} className="border-t border-slate-300">
                  <th scope="row">
                    <label htmlFor={inputId}>{ABILITY_NAMES[ability]}</label>
                  </th>
                  <td>
                    {method === "point-buy" ? (
                      <input
                        id={inputId}
                        type="number"
                        min={POINT_BUY_MIN}
                        max={POINT_BUY_MAX}
                        value={base ?? POINT_BUY_MIN}
                        onChange={(event) => setScore(ability, Number(event.target.value))}
                        className="w-20 rounded border border-slate-500 px-2 py-1"
                      />
                    ) : (
                      <select
                        id={inputId}
                        value={base ?? ""}
                        onChange={(event) =>
                          setScore(ability, event.target.value ? Number(event.target.value) : null)
                        }
                        className="rounded border border-slate-500 px-2 py-1"
                      >
                        <option value="">À choisir</option>
                        {[...new Set(base === null ? remaining : [base, ...remaining])]
                          .sort((a, b) => b - a)
                          .map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                      </select>
                    )}
                  </td>
                  <td>{bonus > 0 ? `+${bonus}` : "—"}</td>
                  <td>{final ?? "—"}</td>
                  <td>{final === null ? "—" : formatModifier(final)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
