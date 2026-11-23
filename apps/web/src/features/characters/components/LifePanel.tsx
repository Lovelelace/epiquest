"use client";

import { COIN_VALUES_IN_COPPER, COINS, totalInCopper, type Coin } from "@epiquest/rules";
import type { Character, CharacterAction, CharacterHistoryEntry } from "@epiquest/schemas";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/shared/lib/http";
import { actOnCharacter, getHistory, searchItems, type SrdOption } from "../api";

const COIN_NAMES: Record<Coin, string> = {
  cp: "pièces de cuivre (pc)",
  sp: "pièces d'argent (pa)",
  ep: "pièces d'électrum (pe)",
  gp: "pièces d'or (po)",
  pp: "pièces de platine (pp)",
};
const ENCUMBRANCE_LABELS = {
  none: "non encombré",
  encumbered: "encombré (vitesse −10 pieds)",
  "heavily-encumbered": "lourdement encombré (vitesse −20 pieds)",
  overloaded: "surchargé (vitesse 5 pieds)",
};

interface LifePanelProps {
  character: Character;
  onChange: (character: Character) => void;
}

/** Vie du personnage : PV, repos, inventaire, argent et notes, enregistrés et historisés côté serveur. */
export function LifePanel({ character, onChange }: LifePanelProps) {
  const [status, setStatus] = useState("");
  const [history, setHistory] = useState<CharacterHistoryEntry[]>([]);
  const [amount, setAmount] = useState(1);
  const [hitDice, setHitDice] = useState(1);
  const [coin, setCoin] = useState<Coin>("gp");
  const [coinAmount, setCoinAmount] = useState(1);
  const [notes, setNotes] = useState(character.state.notes);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SrdOption[]>([]);
  const { state, statistics } = character;

  useEffect(() => {
    getHistory(character.id)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [character.id, character.updatedAt]);

  async function act(action: CharacterAction, success: string) {
    try {
      onChange(await actOnCharacter(character.id, action));
      setStatus(success);
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : "L'action a échoué. Réessayez.");
    }
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    const items = await searchItems(query.trim()).catch(() => []);
    setResults(items);
    setStatus(items.length > 0 ? `${items.length} objets trouvés.` : "Aucun objet trouvé.");
  }

  const goldTotal = totalInCopper(state.money) / COIN_VALUES_IN_COPPER.gp;
  return (
    <section aria-labelledby="life-title" className="grid gap-6">
      <h2 id="life-title" className="text-2xl font-semibold">
        Vie du personnage
      </h2>
      <p role="status" aria-label="Résultat de l'action" className="min-h-6 font-medium">
        {status}
      </p>

      <fieldset className="grid gap-2">
        <legend className="text-lg font-semibold">Points de vie</legend>
        <p>
          {state.currentHitPoints} PV sur {statistics.hitPointMaximum}, {state.temporaryHitPoints}{" "}
          PV temporaires.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid">
            Montant
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="w-24 rounded border border-slate-500 px-2 py-1"
            />
          </label>
          <button
            type="button"
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() => void act({ type: "damage", amount }, `${amount} dégâts appliqués.`)}
          >
            Dégâts
          </button>
          <button
            type="button"
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() => void act({ type: "heal", amount }, `${amount} PV rendus.`)}
          >
            Soins
          </button>
          <button
            type="button"
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() =>
              void act({ type: "temporary-hit-points", amount }, `${amount} PV temporaires reçus.`)
            }
          >
            PV temporaires
          </button>
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-lg font-semibold">Repos</legend>
        <p>
          Dés de vie restants : {state.hitDiceRemaining} sur {statistics.hitDice.count} (d
          {statistics.hitDice.die}).
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid">
            Dés de vie à dépenser
            <input
              type="number"
              min={0}
              max={state.hitDiceRemaining}
              value={hitDice}
              onChange={(event) => setHitDice(Number(event.target.value))}
              className="w-24 rounded border border-slate-500 px-2 py-1"
            />
          </label>
          <button
            type="button"
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() => void act({ type: "short-rest", hitDice }, "Repos court terminé.")}
          >
            Repos court
          </button>
          <button
            type="button"
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() => void act({ type: "long-rest" }, "Repos long terminé.")}
          >
            Repos long
          </button>
        </div>
      </fieldset>

      <section aria-labelledby="inventory-title" className="grid gap-2">
        <h3 id="inventory-title" className="text-lg font-semibold">
          Inventaire
        </h3>
        <p>
          Poids porté : {statistics.carrying.weight} lb sur {statistics.carrying.capacity} lb (
          {ENCUMBRANCE_LABELS[statistics.carrying.encumbrance]}).
        </p>
        <table className="w-full text-left">
          <caption className="sr-only">Objets portés</caption>
          <thead>
            <tr>
              <th scope="col">Objet</th>
              <th scope="col">Quantité</th>
              <th scope="col">Poids</th>
              <th scope="col">Équipé</th>
              <th scope="col">Retirer</th>
            </tr>
          </thead>
          <tbody>
            {state.inventory.map((item) => (
              <tr key={item.slug} className="border-t border-slate-300">
                <th scope="row" lang="en">
                  {item.name}
                </th>
                <td>{item.quantity}</td>
                <td>{item.weight * item.quantity} lb</td>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Équiper ${item.name}`}
                    checked={item.isEquipped}
                    onChange={() =>
                      void act(
                        { type: "equip-item", slug: item.slug, isEquipped: !item.isEquipped },
                        `${item.name} ${item.isEquipped ? "rangé" : "équipé"}.`,
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="rounded border border-slate-500 px-2"
                    onClick={() =>
                      void act(
                        { type: "remove-item", slug: item.slug, quantity: 1 },
                        `${item.name} retiré.`,
                      )
                    }
                  >
                    Retirer 1<span className="sr-only"> {item.name}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form
          onSubmit={(event) => void search(event)}
          className="flex flex-wrap items-end gap-2"
          role="search"
        >
          <label className="grid">
            Chercher un objet (nom anglais du SRD)
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded border border-slate-500 px-2 py-1"
            />
          </label>
          <button type="submit" className="rounded border border-slate-500 px-3 py-1">
            Chercher
          </button>
        </form>
        {results.length > 0 && (
          <ul aria-label="Résultats de la recherche" className="grid gap-1">
            {results.map((item) => (
              <li key={item.slug} className="flex items-center gap-2">
                <span lang="en">{item.name}</span>
                <button
                  type="button"
                  aria-label={`Ajouter ${item.name}`}
                  className="rounded border border-slate-500 px-2"
                  onClick={() =>
                    void act(
                      { type: "add-item", slug: item.slug, quantity: 1 },
                      `${item.name} ajouté.`,
                    )
                  }
                >
                  Ajouter
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <fieldset className="grid gap-2">
        <legend className="text-lg font-semibold">Argent</legend>
        <p>
          {COINS.map((item) => `${state.money[item]} ${item}`).join(", ")} (soit {goldTotal} po en
          tout).
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid">
            Montant
            <input
              type="number"
              min={1}
              value={coinAmount}
              onChange={(event) => setCoinAmount(Number(event.target.value))}
              className="w-24 rounded border border-slate-500 px-2 py-1"
            />
          </label>
          <label className="grid">
            Pièce
            <select
              value={coin}
              // Les options du menu sont exactement les pièces de COINS.
              onChange={(event) => setCoin(event.target.value as Coin)}
              className="rounded border border-slate-500 px-2 py-1"
            >
              {COINS.map((item) => (
                <option key={item} value={item}>
                  {COIN_NAMES[item]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() =>
              void act({ type: "money", delta: { [coin]: coinAmount } }, "Argent ajouté.")
            }
          >
            Recevoir
          </button>
          <button
            type="button"
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() =>
              void act({ type: "money", delta: { [coin]: -coinAmount } }, "Argent dépensé.")
            }
          >
            Dépenser
          </button>
        </div>
      </fieldset>

      <div className="grid gap-2">
        <label htmlFor="character-notes" className="text-lg font-semibold">
          Notes
        </label>
        <textarea
          id="character-notes"
          value={notes}
          maxLength={10_000}
          rows={5}
          onChange={(event) => setNotes(event.target.value)}
          className="rounded border border-slate-500 px-2 py-1"
        />
        <div>
          <button
            type="button"
            className="rounded border border-slate-500 px-3 py-1"
            onClick={() => void act({ type: "notes", notes }, "Notes enregistrées.")}
          >
            Enregistrer les notes
          </button>
        </div>
      </div>

      <section aria-labelledby="history-title">
        <h3 id="history-title" className="text-lg font-semibold">
          Historique
        </h3>
        <ol className="list-disc pl-6">
          {history.map((entry) => (
            <li key={entry.id}>
              <time dateTime={entry.at}>{new Date(entry.at).toLocaleString("fr-FR")}</time> :{" "}
              {entry.summary}
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
