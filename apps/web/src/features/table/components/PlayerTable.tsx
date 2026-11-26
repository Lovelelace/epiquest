import type { PlayerTableView } from "@epiquest/schemas";
import type { ConnectionStatus } from "../use-table-connection";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { PlayerTokenTable } from "./PlayerTokenTable";
import { RollLog } from "./RollLog";
import { TableMap } from "./TableMap";

/**
 * Vue joueurs, en lecture seule : aucune commande ne modifie la partie.
 * Elle n'affiche que ce que le serveur a envoyé, déjà filtré par `projectForPlayers`.
 */
export function PlayerTable({
  view,
  status,
  refusal,
  announcements,
}: {
  view: PlayerTableView | null;
  status: ConnectionStatus;
  refusal: string | null;
  announcements: readonly string[];
}) {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          {view === null ? "Vue joueurs" : `Vue joueurs : ${view.map.name}`}
        </h1>
        <ConnectionStatusBadge status={status} refusal={refusal} />
      </header>

      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {announcements.map((message, index) => (
          <p key={`${index}-${message}`}>{message}</p>
        ))}
      </div>

      {view === null ? (
        <p>Chargement de la table…</p>
      ) : (
        <>
          <section aria-labelledby="player-map-title" className="space-y-3">
            <h2 id="player-map-title" className="text-xl font-semibold">
              Carte
            </h2>
            <TableMap
              map={view.map}
              revealedCells={view.revealedCells}
              tokens={view.tokens}
              fog="opaque"
            />
            <PlayerTokenTable tokens={view.tokens} />
          </section>
          <section aria-labelledby="player-rolls-title" className="space-y-3">
            <h2 id="player-rolls-title" className="text-xl font-semibold">
              Jets publics
            </h2>
            <RollLog rolls={view.rolls} />
          </section>
        </>
      )}
    </main>
  );
}
