import type { PlayerRoll } from "@epiquest/schemas";

/** Derniers jets, du plus récent au plus ancien. `isSecret` n'existe que côté MJ. */
export function RollLog({ rolls }: { rolls: ReadonlyArray<PlayerRoll & { isSecret?: boolean }> }) {
  if (rolls.length === 0) return <p>Aucun jet pour l'instant.</p>;
  return (
    <ol className="max-w-3xl space-y-1">
      {[...rolls].reverse().map((roll) => (
        <li key={roll.id} className="rounded border border-slate-300 px-3 py-1">
          {roll.isSecret === true ? <span className="mr-2 font-semibold">[Secret]</span> : null}
          <span className="font-medium">{roll.label}</span> ({roll.notation}) :{" "}
          <strong>{roll.total}</strong>{" "}
          <span className="text-sm text-slate-700">
            dés [{roll.dice.join(", ")}]
            {roll.modifier !== 0
              ? `, modificateur ${roll.modifier > 0 ? "+" : ""}${roll.modifier}`
              : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}
