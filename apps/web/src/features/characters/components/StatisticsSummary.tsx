import { ABILITIES } from "@epiquest/rules";
import type { DerivedStatisticsContract } from "@epiquest/schemas";
import { ABILITY_NAMES, formatModifier } from "../abilities";

function signed(value: number): string {
  return value >= 0 ? `+${value}` : `−${Math.abs(value)}`;
}

/** Statistiques principales calculées par le moteur. */
export function StatisticsSummary({ statistics }: { statistics: DerivedStatisticsContract }) {
  const facts: [string, string][] = [
    ["Classe d'armure", String(statistics.armorClass)],
    ["Points de vie", String(statistics.hitPointMaximum)],
    ["Initiative", signed(statistics.initiative)],
    ["Vitesse", `${statistics.speed} pieds`],
    ["Bonus de maîtrise", signed(statistics.proficiencyBonus)],
    ["Perception passive", String(statistics.passivePerception)],
  ];
  if (statistics.spellcasting) {
    facts.push(["DD des sorts", String(statistics.spellcasting.saveDc)]);
    facts.push(["Attaque des sorts", signed(statistics.spellcasting.attackBonus)]);
  }
  return (
    <div className="grid gap-4">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded border border-slate-300 p-2">
            <dt className="text-sm text-slate-700">{label}</dt>
            <dd className="text-xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <table className="w-full text-left">
        <caption className="text-left font-semibold">Caractéristiques</caption>
        <thead>
          <tr>
            <th scope="col">Caractéristique</th>
            <th scope="col">Valeur</th>
            <th scope="col">Modificateur</th>
            <th scope="col">Sauvegarde</th>
          </tr>
        </thead>
        <tbody>
          {ABILITIES.map((ability) => (
            <tr key={ability} className="border-t border-slate-300">
              <th scope="row">{ABILITY_NAMES[ability]}</th>
              <td>{statistics.abilityScores[ability]}</td>
              <td>{formatModifier(statistics.abilityScores[ability])}</td>
              <td>
                {signed(statistics.savingThrows[ability].modifier)}
                {statistics.savingThrows[ability].proficiency !== "none" && " (maîtrisée)"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
