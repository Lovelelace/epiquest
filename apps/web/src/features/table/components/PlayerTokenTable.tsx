import type { PlayerToken } from "@epiquest/schemas";
import { describeHealth, describePosition, TOKEN_KIND_LABELS } from "../labels";

/** Alternative textuelle de la carte pour les joueurs : un vrai tableau, navigable (A11Y-11). */
export function PlayerTokenTable({ tokens }: { tokens: readonly PlayerToken[] }) {
  if (tokens.length === 0) return <p>Aucun jeton visible.</p>;
  return (
    <table className="w-full max-w-3xl border-collapse text-left">
      <caption className="sr-only">Jetons visibles sur la carte</caption>
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
          <th scope="col" className="py-1">
            Santé
          </th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
          <tr key={token.id} className="border-b border-slate-200">
            <th scope="row" className="py-1 pr-4 font-medium">
              {token.name}
            </th>
            <td className="py-1 pr-4">{TOKEN_KIND_LABELS[token.kind]}</td>
            <td className="py-1 pr-4">{describePosition(token.position)}</td>
            <td className="py-1">{describeHealth(token.health)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
