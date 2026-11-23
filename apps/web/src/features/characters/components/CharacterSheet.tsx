"use client";

import { ABILITIES, ABILITY_LABELS, SKILL_LABELS, SKILLS } from "@epiquest/rules";
import type {
  Character,
  CharacterRoll,
  CharacterRollRequest,
  RollVisibility,
} from "@epiquest/schemas";
import { useEffect, useState } from "react";
import { getCharacter, getRecentRolls, rollFromSheet, sheetPdfUrl } from "../api";
import { describeRoll, signed, VISIBILITY_LABELS } from "../roll-text";
import { LevelUpPanel } from "./LevelUpPanel";
import { LifePanel } from "./LifePanel";

const VISIBILITIES: RollVisibility[] = ["public", "private", "hidden"];
const PROFICIENCY_MARKS = { none: "", proficient: " (maîtrise)", expertise: " (expertise)" };

interface RollButtonProps {
  label: string;
  value: string;
  onRoll: () => void;
}

/** Un bouton par jet : Entrée ou Espace le lance, comme un clic. */
function RollButton({ label, value, onRoll }: RollButtonProps) {
  return (
    <button
      type="button"
      onClick={onRoll}
      className="flex w-full justify-between gap-2 rounded border border-slate-400 px-2 py-1 text-left hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
    >
      <span>{label}</span> <span className="font-semibold">{value}</span>
    </button>
  );
}

/** Fiche de personnage : chaque compétence, sauvegarde ou attaque lance son jet côté serveur. */
export function CharacterSheet({ characterId }: { characterId: string }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [rolls, setRolls] = useState<CharacterRoll[]>([]);
  const [visibility, setVisibility] = useState<RollVisibility>("public");
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCharacter(characterId)
      .then(setCharacter)
      .catch(() => setError("Ce personnage est introuvable."));
    getRecentRolls(characterId)
      .then(setRolls)
      .catch(() => setRolls([]));
  }, [characterId]);

  async function roll(request: Omit<CharacterRollRequest, "visibility">) {
    try {
      const result = await rollFromSheet(characterId, { ...request, visibility });
      setRolls((previous) => [result, ...previous].slice(0, 20));
      setAnnouncement(describeRoll(result));
    } catch {
      setAnnouncement("Le jet a échoué. Réessayez.");
    }
  }

  if (error) return <p role="alert">{error}</p>;
  if (!character) return <p>Chargement du personnage…</p>;
  const { statistics } = character;

  return (
    <article className="grid gap-8">
      <header>
        <h1 className="text-3xl font-bold">{character.name}</h1>
        <p lang="en">
          {character.species.name} · {character.class.name} {character.level}
          {character.subclass ? ` (${character.subclass.name})` : ""} · {character.background.name}
        </p>
        <a
          href={sheetPdfUrl(character.id)}
          download
          className="mt-2 inline-block font-semibold text-indigo-700 underline hover:text-indigo-900 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Exporter la fiche en PDF
        </a>
      </header>

      <fieldset>
        <legend className="font-semibold">Visibilité des jets</legend>
        <div className="mt-1 flex flex-wrap gap-4">
          {VISIBILITIES.map((item) => (
            <label key={item} className="flex items-center gap-2">
              <input
                type="radio"
                name="roll-visibility"
                checked={visibility === item}
                onChange={() => setVisibility(item)}
              />
              {VISIBILITY_LABELS[item]}
            </label>
          ))}
        </div>
      </fieldset>

      <p
        role="status"
        aria-label="Résultat du jet"
        className="min-h-6 rounded bg-slate-100 px-3 py-2 font-medium"
      >
        {announcement}
      </p>

      <section aria-labelledby="combat-title" className="grid gap-2">
        <h2 id="combat-title" className="text-2xl font-semibold">
          Combat
        </h2>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-slate-700">Classe d&apos;armure</dt>
            <dd className="text-xl font-semibold">{statistics.armorClass}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-700">Points de vie</dt>
            <dd className="text-xl font-semibold">
              {character.state.currentHitPoints} / {statistics.hitPointMaximum}
              {character.state.temporaryHitPoints > 0 &&
                ` (+${character.state.temporaryHitPoints} temporaires)`}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-700">Vitesse</dt>
            <dd className="text-xl font-semibold">{statistics.speed} pieds</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-700">Perception passive</dt>
            <dd className="text-xl font-semibold">{statistics.passivePerception}</dd>
          </div>
        </dl>
        <div className="max-w-xs">
          <RollButton
            label="Initiative"
            value={signed(statistics.initiative)}
            onRoll={() => void roll({ kind: "initiative" })}
          />
        </div>
        {character.attacks.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {character.attacks.map((attack) => (
              <li key={attack.slug} className="grid gap-1">
                <RollButton
                  label={`Attaque : ${attack.name}`}
                  value={signed(attack.attackBonus)}
                  onRoll={() => void roll({ kind: "attack", key: attack.slug })}
                />
                <RollButton
                  label={`Dégâts : ${attack.name}`}
                  value={`${attack.damage} ${attack.damageType}`}
                  onRoll={() => void roll({ kind: "damage", key: attack.slug })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="abilities-title">
        <h2 id="abilities-title" className="text-2xl font-semibold">
          Caractéristiques et sauvegardes
        </h2>
        <ul className="mt-2 grid gap-3 sm:grid-cols-2">
          {ABILITIES.map((ability) => (
            <li key={ability} className="grid gap-1 rounded border border-slate-300 p-2">
              <p className="font-semibold">
                {ABILITY_LABELS[ability]} {statistics.abilityScores[ability]}
              </p>
              <RollButton
                label={`Test de ${ABILITY_LABELS[ability]}`}
                value={signed(statistics.abilityModifiers[ability])}
                onRoll={() => void roll({ kind: "ability", key: ability })}
              />
              <RollButton
                label={`Sauvegarde de ${ABILITY_LABELS[ability]}${PROFICIENCY_MARKS[statistics.savingThrows[ability].proficiency]}`}
                value={signed(statistics.savingThrows[ability].modifier)}
                onRoll={() => void roll({ kind: "save", key: ability })}
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="skills-title">
        <h2 id="skills-title" className="text-2xl font-semibold">
          Compétences
        </h2>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {SKILLS.map((skill) => (
            <li key={skill}>
              <RollButton
                label={`${SKILL_LABELS[skill]}${PROFICIENCY_MARKS[statistics.skills[skill].proficiency]}`}
                value={signed(statistics.skills[skill].modifier)}
                onRoll={() => void roll({ kind: "skill", key: skill })}
              />
            </li>
          ))}
        </ul>
      </section>

      {statistics.spellcasting && (
        <section aria-labelledby="spells-title">
          <h2 id="spells-title" className="text-2xl font-semibold">
            Sorts
          </h2>
          <p>
            DD des sorts {statistics.spellcasting.saveDc}, attaque des sorts{" "}
            {signed(statistics.spellcasting.attackBonus)}. Emplacements :{" "}
            {statistics.spellcasting.slots.slots
              .map((count, index) => `niveau ${index + 1} : ${count}`)
              .join(", ") || "aucun"}
            .
          </p>
          <ul lang="en" className="mt-1 list-disc pl-6">
            {[
              ...character.cantrips.map((spell) => ({ ...spell, level: 0 })),
              ...character.spells,
            ].map((spell) => (
              <li key={spell.slug}>
                {spell.name}{" "}
                <span lang="fr">
                  ({spell.level === 0 ? "sort mineur" : `niveau ${spell.level}`})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="features-title">
        <h2 id="features-title" className="text-2xl font-semibold">
          Capacités
        </h2>
        <ul lang="en" className="mt-1 list-disc pl-6">
          {character.features.map((feature) => (
            <li key={`${feature.slug}-${feature.level}`}>
              {feature.name} <span lang="fr">(niveau {feature.level})</span>
            </li>
          ))}
        </ul>
      </section>

      <LifePanel character={character} onChange={setCharacter} />

      <LevelUpPanel character={character} onChange={setCharacter} />

      <section aria-labelledby="rolls-title">
        <h2 id="rolls-title" className="text-2xl font-semibold">
          Derniers jets
        </h2>
        {rolls.length === 0 ? (
          <p>Aucun jet pour l&apos;instant.</p>
        ) : (
          <ol className="mt-1 list-disc pl-6">
            {rolls.map((item) => (
              <li key={item.id}>
                {describeRoll(item)}{" "}
                <span className="text-slate-700">({VISIBILITY_LABELS[item.visibility]})</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
