import type { TableState } from "@epiquest/schemas";
import type { ConnectionStatus } from "../use-table-connection";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { GmTokenTable } from "./GmTokenTable";
import { RollLog } from "./RollLog";
import { TableMap } from "./TableMap";

/** Vue MJ : l'état complet de la table et l'accès à la vue joueurs en seconde fenêtre. */
export function GmTable({
  state,
  status,
  refusal,
  playersViewHref,
}: {
  state: TableState | null;
  status: ConnectionStatus;
  refusal: string | null;
  playersViewHref: string;
}) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          {state === null ? "Vue MJ" : `Vue MJ : ${state.map.name}`}
        </h1>
        <ConnectionStatusBadge status={status} refusal={refusal} />
        <p>
          <a
            href={playersViewHref}
            target="epiquest-vue-joueurs"
            rel="noopener"
            className="inline-block rounded border-2 border-slate-900 px-3 py-1 font-medium underline"
          >
            Ouvrir la vue joueurs (nouvelle fenêtre)
          </a>
        </p>
      </header>

      {state === null ? (
        <p>Chargement de la table…</p>
      ) : (
        <>
          <section aria-labelledby="gm-map-title" className="space-y-3">
            <h2 id="gm-map-title" className="text-xl font-semibold">
              Carte
            </h2>
            <p className="text-sm text-slate-700">
              Les cases hachurées sont dans le brouillard pour les joueurs ; les jetons en
              pointillés leur sont cachés.
            </p>
            <TableMap
              map={state.map}
              revealedCells={state.revealedCells}
              tokens={state.tokens.map((token) => ({
                ...token,
                isHiddenFromPlayers: !token.isVisibleToPlayers,
              }))}
              fog="translucent"
            />
            <GmTokenTable tokens={state.tokens} />
          </section>
          <section aria-labelledby="gm-rolls-title" className="space-y-3">
            <h2 id="gm-rolls-title" className="text-xl font-semibold">
              Jets
            </h2>
            <RollLog
              rolls={state.rolls.map((roll) => ({ ...roll, isSecret: roll.visibility === "gm" }))}
            />
          </section>
        </>
      )}
    </main>
  );
}
