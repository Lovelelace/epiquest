import type { TableToken } from "@epiquest/schemas";
import { describePosition, TOKEN_KIND_LABELS } from "../labels";

/** Alternative textuelle de la carte pour le MJ : tout, y compris ce qui est caché. */
export function GmTokenTable({ tokens }: { tokens: readonly TableToken[] }) {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">Tous les jetons de la carte</caption>
      <thead>
        <tr className="border-b border-slate-700">
          <th scope="col" className="py-1 pr-4">
            Nom
          </th>
          <th scope="col" className="py-1 pr-4">
            Type
          </th>
          <th scope="col" className="py-1 pr-4">
            Position
          </th>
          <th scope="col" className="py-1 pr-4">
            PV
          </th>
          <th scope="col" className="py-1 pr-4">
            Vu des joueurs
          </th>
          <th scope="col" className="py-1">
            Notes du MJ
          </th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
          <tr key={token.id} className="border-b border-slate-200 align-top">
            <th scope="row" className="py-1 pr-4 font-medium">
              {token.name}
            </th>
            <td className="py-1 pr-4">{TOKEN_KIND_LABELS[token.kind]}</td>
            <td className="py-1 pr-4">{describePosition(token.position)}</td>
            <td className="py-1 pr-4">
              {token.hitPoints === null
                ? "—"
                : `${token.hitPoints.current} / ${token.hitPoints.maximum}`}
            </td>
            <td className="py-1 pr-4">{token.isVisibleToPlayers ? "Oui" : "Non (caché)"}</td>
            <td className="py-1 text-sm">{token.gmNotes === "" ? "—" : token.gmNotes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
