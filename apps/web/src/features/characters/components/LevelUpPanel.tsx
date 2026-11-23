"use client";

import {
  ABILITIES,
  type Ability,
  abilityModifier,
  classProgression,
  MAX_SUPPORTED_LEVEL,
  type Skill,
} from "@epiquest/rules";
import type { Character, LevelUpOptions } from "@epiquest/schemas";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/shared/lib/http";
import { ABILITY_NAMES } from "../abilities";
import { getLevelUpOptions, levelUp } from "../api";
import { SKILL_NAMES } from "../skill-names";
import { CheckboxGroup } from "./CheckboxGroup";

type ImprovementMode = "single" | "pair";

interface LevelUpPanelProps {
  character: Character;
  onChange: (character: Character) => void;
}

/** Choix d'augmentation de caractéristique : +2 à une, ou +1 à deux différentes. */
function improvementBonuses(mode: ImprovementMode, first: Ability, second: Ability) {
  return mode === "single"
    ? [{ ability: first, amount: 2 }]
    : [
        { ability: first, amount: 1 },
        { ability: second, amount: 1 },
      ];
}

/**
 * Montée de niveau (jusqu'au niveau 5) : PV, sous-classe, augmentation de caractéristique,
 * expertise et sorts. Le serveur valide avec le moteur de règles et tire le dé de vie.
 */
export function LevelUpPanel({ character, onChange }: LevelUpPanelProps) {
  const [options, setOptions] = useState<LevelUpOptions | null>(null);
  const [status, setStatus] = useState("");
  const [hitPointMethod, setHitPointMethod] = useState<"average" | "roll">("average");
  const [subclass, setSubclass] = useState<string | null>(null);
  const [mode, setMode] = useState<ImprovementMode>("single");
  const [first, setFirst] = useState<Ability>("str");
  const [second, setSecond] = useState<Ability>("dex");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [cantrips, setCantrips] = useState<string[]>([]);
  const [spells, setSpells] = useState<string[]>([]);
  const canLevelUp = character.level < MAX_SUPPORTED_LEVEL;

  useEffect(() => {
    if (!canLevelUp) return;
    getLevelUpOptions(character.id)
      .then((loaded) => {
        setOptions(loaded);
        setSubclass(null);
        setExpertise([]);
        setCantrips([]);
        setSpells(character.spells.map((spell) => spell.slug));
      })
      .catch(() => setOptions(null));
  }, [canLevelUp, character.id, character.level, character.spells]);

  if (!canLevelUp) {
    return (
      <section aria-labelledby="level-up-title" className="grid gap-2">
        <h2 id="level-up-title" className="text-2xl font-semibold">
          Monter de niveau
        </h2>
        <p>Le niveau {MAX_SUPPORTED_LEVEL} est le plus haut niveau pris en charge.</p>
      </section>
    );
  }

  const improvements = options?.abilityScoreImprovement
    ? improvementBonuses(mode, first, second)
    : [];
  const spellcasting = character.statistics.spellcasting;
  // Sorts préparés : le modificateur augmenté donne des sorts en plus, le serveur le revérifie.
  const preparedBonus =
    spellcasting && classProgression(character.class.slug).spellcasting?.spells.kind === "prepared"
      ? improvements
          .filter((bonus) => bonus.ability === spellcasting.ability)
          .reduce((total, bonus) => {
            const score = character.statistics.abilityScores[bonus.ability];
            return total + abilityModifier(score + bonus.amount) - abilityModifier(score);
          }, 0)
      : 0;
  const maxSpells = (options?.maxSpells ?? 0) + preparedBonus;
  const knownCantrips = new Set(character.cantrips.map((spell) => spell.slug));
  const proficientSkills = Object.entries(character.statistics.skills)
    .filter(([, check]) => check.proficiency === "proficient")
    .map(([skill]) => skill as Skill); // clés du contrat : toujours des compétences

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!options) return;
    try {
      const leveled = await levelUp(character.id, {
        hitPointMethod,
        ...(subclass ? { subclass } : {}),
        abilityScoreImprovement: improvements,
        expertise: expertise as Skill[], // valeurs issues de proficientSkills
        cantrips,
        ...(spellcasting ? { spells } : {}),
      });
      onChange(leveled);
      setStatus(`${leveled.name} passe au niveau ${leveled.level}.`);
    } catch (error) {
      const details =
        error instanceof ApiError && Array.isArray(error.details)
          ? error.details
              .map((detail) => (detail as { message?: string }).message)
              .filter(Boolean)
              .join(" ")
          : "";
      setStatus(
        error instanceof ApiError
          ? `${error.message} ${details}`.trim()
          : "La montée de niveau a échoué. Réessayez.",
      );
    }
  }

  return (
    <section aria-labelledby="level-up-title" className="grid gap-4">
      <h2 id="level-up-title" className="text-2xl font-semibold">
        Monter de niveau
      </h2>
      <p role="status" aria-label="Résultat de la montée de niveau" className="min-h-6 font-medium">
        {status}
      </p>
      {options ? (
        <form onSubmit={submit} className="grid gap-4">
          <p>
            Niveau {options.nextLevel} :{" "}
            {options.features.length > 0 ? (
              <span lang="en">{options.features.map((feature) => feature.name).join(", ")}</span>
            ) : (
              "aucune nouvelle capacité de classe"
            )}
            .
          </p>

          <fieldset className="grid gap-1">
            <legend className="text-lg font-semibold">Points de vie gagnés</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hit-point-method"
                checked={hitPointMethod === "average"}
                onChange={() => setHitPointMethod("average")}
              />
              Moyenne : {options.averageHitPoints} + modificateur de Constitution
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hit-point-method"
                checked={hitPointMethod === "roll"}
                onChange={() => setHitPointMethod("roll")}
              />
              Jet de 1d{options.hitDie} + modificateur de Constitution, tiré par le serveur
            </label>
          </fieldset>

          {options.subclassOptions.length > 0 && (
            <fieldset className="grid gap-1">
              <legend className="text-lg font-semibold">Sous-classe</legend>
              {options.subclassOptions.map((option) => (
                <label key={option.slug} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="subclass"
                    required
                    checked={subclass === option.slug}
                    onChange={() => setSubclass(option.slug)}
                  />
                  <span lang="en">{option.name}</span>
                </label>
              ))}
            </fieldset>
          )}

          {options.abilityScoreImprovement && (
            <fieldset className="grid gap-2">
              <legend className="text-lg font-semibold">Augmentation de caractéristique</legend>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="improvement-mode"
                  checked={mode === "single"}
                  onChange={() => setMode("single")}
                />
                +2 à une caractéristique
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="improvement-mode"
                  checked={mode === "pair"}
                  onChange={() => setMode("pair")}
                />
                +1 à deux caractéristiques
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="grid gap-1">
                  {mode === "single" ? "Caractéristique" : "Première caractéristique"}
                  <select
                    className="rounded border border-slate-500 px-2 py-1"
                    value={first}
                    onChange={(event) => setFirst(event.target.value as Ability)} // options = ABILITIES
                  >
                    {ABILITIES.map((ability) => (
                      <option key={ability} value={ability}>
                        {ABILITY_NAMES[ability]} ({character.statistics.abilityScores[ability]})
                      </option>
                    ))}
                  </select>
                </label>
                {mode === "pair" && (
                  <label className="grid gap-1">
                    Seconde caractéristique
                    <select
                      className="rounded border border-slate-500 px-2 py-1"
                      value={second}
                      onChange={(event) => setSecond(event.target.value as Ability)} // options = ABILITIES
                    >
                      {ABILITIES.filter((ability) => ability !== first).map((ability) => (
                        <option key={ability} value={ability}>
                          {ABILITY_NAMES[ability]} ({character.statistics.abilityScores[ability]})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </fieldset>
          )}

          {options.expertiseCount > 0 && (
            <CheckboxGroup
              legend="Expertise"
              hint="Doublez le bonus de maîtrise de compétences déjà maîtrisées"
              options={proficientSkills.map((skill) => ({
                value: skill,
                label: SKILL_NAMES[skill],
              }))}
              selected={expertise}
              max={options.expertiseCount}
              onChange={setExpertise}
            />
          )}

          {options.newCantrips > 0 && (
            <CheckboxGroup
              legend="Nouveaux sorts mineurs"
              hint="Choisissez vos nouveaux sorts mineurs"
              options={options.spellList
                .filter((spell) => spell.level === 0 && !knownCantrips.has(spell.slug))
                .map((spell) => ({ value: spell.slug, label: spell.name, lang: "en" }))}
              selected={cantrips}
              max={options.newCantrips}
              onChange={setCantrips}
            />
          )}

          {spellcasting && maxSpells > 0 && (
            <CheckboxGroup
              legend="Sorts connus ou préparés"
              hint={`Sorts jusqu'au niveau accessible au niveau ${options.nextLevel}`}
              options={options.spellList
                .filter((spell) => spell.level > 0)
                .map((spell) => ({
                  value: spell.slug,
                  label: `${spell.name} (niveau ${spell.level})`,
                  lang: "en",
                }))}
              selected={spells}
              max={maxSpells}
              onChange={setSpells}
            />
          )}

          <button
            type="submit"
            className="justify-self-start rounded bg-indigo-700 px-4 py-2 font-semibold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Passer au niveau {options.nextLevel}
          </button>
        </form>
      ) : (
        <p>Chargement des choix du niveau suivant…</p>
      )}
    </section>
  );
}
