"use client";

import {
  TABLE_EVENTS,
  type GridPosition,
  type RollVisibility,
  type TableAck,
  type TableState,
} from "@epiquest/schemas";
import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { describePosition } from "../labels";

export type SendAction = (event: string, payload: unknown) => Promise<TableAck>;

/** Déplacement d'une case par touche fléchée. */
const ARROW_MOVES: Record<string, { label: string; column: number; row: number }> = {
  ArrowUp: { label: "Haut", column: 0, row: -1 },
  ArrowLeft: { label: "Gauche", column: -1, row: 0 },
  ArrowRight: { label: "Droite", column: 1, row: 0 },
  ArrowDown: { label: "Bas", column: 0, row: 1 },
};

const FIELD = "rounded border border-slate-500 px-2 py-1";
const BUTTON =
  "min-h-6 rounded border-2 border-slate-900 bg-white px-3 py-1 font-medium hover:bg-slate-100";

/**
 * Commandes du MJ. Le client envoie des intentions ; le serveur valide, applique et diffuse
 * (ARCH-12). Tout se fait au clavier (A11Y-05) : les flèches déplacent le jeton sélectionné
 * quand un bouton de déplacement a le focus.
 */
export function GmControls({ state, send }: { state: TableState; send: SendAction }) {
  const ids = useId();
  const [selectedId, setSelectedId] = useState(state.tokens[0]?.id ?? "");
  const [feedback, setFeedback] = useState("");
  const selected = state.tokens.find((token) => token.id === selectedId) ?? state.tokens[0];
  const campaignId = state.campaignId;

  async function run(event: string, payload: object, success: string): Promise<void> {
    const ack = await send(event, { campaignId, ...payload });
    setFeedback(ack.ok ? success : `Refusé : ${ack.error.message}`);
  }

  function move(delta: { column: number; row: number }): void {
    if (selected === undefined) return;
    const position = {
      column: selected.position.column + delta.column,
      row: selected.position.row + delta.row,
    };
    void run(
      TABLE_EVENTS.moveToken,
      { tokenId: selected.id, position },
      `${selected.name} déplacé en ${describePosition(position)}.`,
    );
  }

  function onMoveKeyDown(event: KeyboardEvent<HTMLFieldSetElement>): void {
    const delta = ARROW_MOVES[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    move(delta);
  }

  function onHitPoints(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (selected === undefined) return;
    const current = Number(new FormData(event.currentTarget).get("current"));
    void run(
      TABLE_EVENTS.setHitPoints,
      { tokenId: selected.id, current },
      `PV de ${selected.name} : ${current}.`,
    );
  }

  function onFog(form: HTMLFormElement | null, isRevealed: boolean): void {
    if (form === null || !form.reportValidity()) return;
    const data = new FormData(form);
    const cells = rectangle(
      { column: Number(data.get("fromColumn")) - 1, row: Number(data.get("fromRow")) - 1 },
      { column: Number(data.get("toColumn")) - 1, row: Number(data.get("toRow")) - 1 },
    );
    void run(
      TABLE_EVENTS.setFog,
      { cells, isRevealed },
      `${cells.length} cases ${isRevealed ? "révélées" : "recouvertes"}.`,
    );
  }

  function onRoll(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const visibility: RollVisibility = data.get("visibility") === "gm" ? "gm" : "public";
    void run(
      TABLE_EVENTS.roll,
      { label: String(data.get("label")), notation: String(data.get("notation")), visibility },
      "Jet lancé.",
    );
  }

  if (selected === undefined) return <p>Aucun jeton sur la carte.</p>;

  return (
    <section aria-labelledby={`${ids}-title`} className="space-y-4">
      <h2 id={`${ids}-title`} className="text-xl font-semibold">
        Commandes du MJ
      </h2>
      <p role="status" className="min-h-6 font-medium">
        {feedback}
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          Jeton sélectionné
          <select
            className={FIELD}
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {state.tokens.map((token) => (
              <option key={token.id} value={token.id}>
                {token.name} ({describePosition(token.position)})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-6 w-6"
            checked={selected.isVisibleToPlayers}
            onChange={(event) =>
              void run(
                TABLE_EVENTS.setTokenVisibility,
                { tokenId: selected.id, isVisibleToPlayers: event.target.checked },
                `${selected.name} ${event.target.checked ? "visible des joueurs" : "caché aux joueurs"}.`,
              )
            }
          />
          Visible des joueurs
        </label>
      </div>

      <fieldset onKeyDown={onMoveKeyDown} className="space-y-2">
        <legend className="font-medium">
          Déplacer {selected.name} (flèches du clavier ou boutons)
        </legend>
        <div className="flex flex-wrap gap-2">
          {Object.values(ARROW_MOVES).map((delta) => (
            <button key={delta.label} type="button" className={BUTTON} onClick={() => move(delta)}>
              {delta.label}
            </button>
          ))}
        </div>
      </fieldset>

      {selected.hitPoints === null ? null : (
        <form
          onSubmit={onHitPoints}
          className="flex flex-wrap items-end gap-2"
          key={`${selected.id}-${selected.hitPoints.current}`}
        >
          <label className="flex flex-col gap-1">
            PV actuels (maximum {selected.hitPoints.maximum})
            <input
              name="current"
              type="number"
              min={0}
              max={selected.hitPoints.maximum}
              required
              defaultValue={selected.hitPoints.current}
              className={FIELD}
            />
          </label>
          <button type="submit" className={BUTTON}>
            Appliquer les PV
          </button>
        </form>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onFog(event.currentTarget, true);
        }}
        className="space-y-2"
        aria-labelledby={`${ids}-fog`}
      >
        <h3 id={`${ids}-fog`} className="font-medium">
          Brouillard (zone rectangulaire, comptée à partir de 1)
        </h3>
        <div className="flex flex-wrap items-end gap-2">
          {(
            [
              ["fromColumn", "De la colonne", 1, state.map.columns],
              ["toColumn", "À la colonne", state.map.columns, state.map.columns],
              ["fromRow", "De la ligne", 1, state.map.rows],
              ["toRow", "À la ligne", state.map.rows, state.map.rows],
            ] as const
          ).map(([name, label, initial, maximum]) => (
            <label key={name} className="flex flex-col gap-1">
              {label}
              <input
                name={name}
                type="number"
                min={1}
                max={maximum}
                required
                defaultValue={initial}
                className={`${FIELD} w-24`}
              />
            </label>
          ))}
          <button type="submit" className={BUTTON}>
            Révéler la zone
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={(event) => onFog(event.currentTarget.form, false)}
          >
            Recouvrir la zone
          </button>
        </div>
      </form>

      <form onSubmit={onRoll} className="space-y-2" aria-labelledby={`${ids}-roll`}>
        <h3 id={`${ids}-roll`} className="font-medium">
          Lancer un jet
        </h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            Intitulé
            <input name="label" required defaultValue="Initiative" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1">
            Dés (par exemple 1d20+2)
            <input name="notation" required defaultValue="1d20" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1">
            Visibilité
            <select name="visibility" defaultValue="public" className={FIELD}>
              <option value="public">Public</option>
              <option value="gm">Secret (MJ seulement)</option>
            </select>
          </label>
          <button type="submit" className={BUTTON}>
            Lancer
          </button>
        </div>
      </form>
    </section>
  );
}

/** Toutes les cases du rectangle entre deux coins, dans n'importe quel ordre. */
export function rectangle(first: GridPosition, second: GridPosition): GridPosition[] {
  const cells: GridPosition[] = [];
  for (let row = Math.min(first.row, second.row); row <= Math.max(first.row, second.row); row++) {
    for (
      let column = Math.min(first.column, second.column);
      column <= Math.max(first.column, second.column);
      column++
    ) {
      cells.push({ column, row });
    }
  }
  return cells;
}
