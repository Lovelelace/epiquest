/** Lecture défensive des données brutes du SRD pour l'affichage du détail d'une option. */

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Raw[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function names(value: unknown): string[] {
  return records(value)
    .map((entry) => entry.name)
    .filter((name): name is string => typeof name === "string");
}

export interface DetailFact {
  label: string;
  value: string;
}

const ABILITY_LABELS: Record<string, string> = {
  str: "For",
  dex: "Dex",
  con: "Con",
  int: "Int",
  wis: "Sag",
  cha: "Cha",
};

function abilityBonuses(data: Raw): string {
  return records(data.ability_bonuses)
    .map((bonus) => {
      const ability = isRecord(bonus.ability_score) ? String(bonus.ability_score.index) : "";
      return `${ABILITY_LABELS[ability] ?? ability} +${String(bonus.bonus)}`;
    })
    .join(", ");
}

/** Faits clés d'une espèce, d'une classe ou d'un historique, en français. */
export function detailFacts(entity: string, data: Raw): DetailFact[] {
  const facts: DetailFact[] = [];
  const add = (label: string, value: string) => {
    if (value) facts.push({ label, value });
  };
  if (entity === "species") {
    add("Bonus de caractéristique", abilityBonuses(data));
    if (typeof data.speed === "number") add("Vitesse", `${data.speed} pieds`);
    add("Traits", [...names(data.traits), ...names(data.racial_traits)].join(", "));
    add("Langues", names(data.languages).join(", "));
  } else if (entity === "classes") {
    if (typeof data.hit_die === "number") add("Dé de vie", `d${data.hit_die}`);
    add("Jets de sauvegarde", names(data.saving_throws).join(", "));
    add("Maîtrises", names(data.proficiencies).join(", "));
    const [choice] = records(data.proficiency_choices);
    if (choice && typeof choice.desc === "string") add("Compétences", choice.desc);
  } else {
    add("Maîtrises", names(data.starting_proficiencies).join(", "));
  }
  return facts;
}

/** Sous-espèces proposées par une espèce (« high-elf » pour « elf »). */
export function subspecies(data: Raw): { slug: string; name: string }[] {
  return records(data.subraces).flatMap((entry) =>
    typeof entry.index === "string" && typeof entry.name === "string"
      ? [{ slug: entry.index, name: entry.name }]
      : [],
  );
}
