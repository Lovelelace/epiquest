import type { Ability } from "../abilities.js";
import type { Skill } from "./skills.js";
import type { SpellcastingProgression, UnarmoredDefense } from "./types.js";

/**
 * Progression des classes du SRD 5.1 jusqu'au niveau 5, le niveau maximal visé par le produit.
 * Ces valeurs viennent des tables de classe du SRD ; elles ne sont pas dans les fichiers importés
 * (le fichier des niveaux de la source n'est pas copié), d'où cette table versionnée (DATA-18).
 */
export const MAX_SUPPORTED_LEVEL = 5;

export interface ClassFeature {
  slug: string;
  name: string;
}

export type SpellSelection =
  /** Sorts connus : nombre fixe par niveau (index 0 = niveau 1). */
  | { kind: "known"; counts: readonly number[] }
  /** Sorts préparés : modificateur + niveau / diviseur, au moins 1 s'il a des emplacements. */
  | { kind: "prepared"; levelDivisor: 1 | 2 };

export interface ClassSpellcasting {
  ability: Ability;
  progression: SpellcastingProgression;
  cantripsKnown: readonly number[];
  spells: SpellSelection;
}

export interface ClassProgression {
  subclassLevel: number;
  abilityScoreImprovementLevels: readonly number[];
  /** Nombre de compétences avec expertise gagnées, par niveau. */
  expertise: Readonly<Record<number, number>>;
  unarmoredDefense: UnarmoredDefense | null;
  spellcasting: ClassSpellcasting | null;
  /** Capacités gagnées à chaque niveau, de 1 à 5. */
  features: Readonly<Record<number, readonly ClassFeature[]>>;
}

const STANDARD_IMPROVEMENTS = [4, 8, 12, 16, 19] as const;
const IMPROVEMENT: ClassFeature = {
  slug: "ability-score-improvement",
  name: "Ability Score Improvement",
};
const EXTRA_ATTACK: ClassFeature = { slug: "extra-attack", name: "Extra Attack" };
const SPELLCASTING: ClassFeature = { slug: "spellcasting", name: "Spellcasting" };
const FIGHTING_STYLE: ClassFeature = { slug: "fighting-style", name: "Fighting Style" };

function feature(slug: string, name: string): ClassFeature {
  return { slug, name };
}

function martial(
  overrides: Partial<ClassProgression> & Pick<ClassProgression, "features">,
): ClassProgression {
  return {
    subclassLevel: 3,
    abilityScoreImprovementLevels: STANDARD_IMPROVEMENTS,
    expertise: {},
    unarmoredDefense: null,
    spellcasting: null,
    ...overrides,
  };
}

export const CLASS_PROGRESSIONS: Readonly<Record<string, ClassProgression>> = {
  barbarian: martial({
    unarmoredDefense: { ability: "con", allowsShield: true },
    features: {
      1: [feature("rage", "Rage"), feature("unarmored-defense", "Unarmored Defense")],
      2: [feature("reckless-attack", "Reckless Attack"), feature("danger-sense", "Danger Sense")],
      3: [feature("primal-path", "Primal Path")],
      4: [IMPROVEMENT],
      5: [EXTRA_ATTACK, feature("fast-movement", "Fast Movement")],
    },
  }),
  bard: martial({
    expertise: { 3: 2 },
    spellcasting: {
      ability: "cha",
      progression: "full",
      cantripsKnown: [2, 2, 2, 3, 3],
      spells: { kind: "known", counts: [4, 5, 6, 7, 8] },
    },
    features: {
      1: [SPELLCASTING, feature("bardic-inspiration", "Bardic Inspiration")],
      2: [
        feature("jack-of-all-trades", "Jack of All Trades"),
        feature("song-of-rest", "Song of Rest"),
      ],
      3: [feature("bard-college", "Bard College"), feature("expertise", "Expertise")],
      4: [IMPROVEMENT],
      5: [feature("font-of-inspiration", "Font of Inspiration")],
    },
  }),
  cleric: martial({
    subclassLevel: 1,
    spellcasting: {
      ability: "wis",
      progression: "full",
      cantripsKnown: [3, 3, 3, 4, 4],
      spells: { kind: "prepared", levelDivisor: 1 },
    },
    features: {
      1: [SPELLCASTING, feature("divine-domain", "Divine Domain")],
      2: [feature("channel-divinity", "Channel Divinity"), feature("turn-undead", "Turn Undead")],
      3: [],
      4: [IMPROVEMENT],
      5: [feature("destroy-undead", "Destroy Undead")],
    },
  }),
  druid: martial({
    subclassLevel: 2,
    spellcasting: {
      ability: "wis",
      progression: "full",
      cantripsKnown: [2, 2, 2, 3, 3],
      spells: { kind: "prepared", levelDivisor: 1 },
    },
    features: {
      1: [feature("druidic", "Druidic"), SPELLCASTING],
      2: [feature("wild-shape", "Wild Shape"), feature("druid-circle", "Druid Circle")],
      3: [],
      4: [IMPROVEMENT],
      5: [],
    },
  }),
  fighter: martial({
    abilityScoreImprovementLevels: [4, 6, 8, 12, 14, 16, 19],
    features: {
      1: [FIGHTING_STYLE, feature("second-wind", "Second Wind")],
      2: [feature("action-surge", "Action Surge")],
      3: [feature("martial-archetype", "Martial Archetype")],
      4: [IMPROVEMENT],
      5: [EXTRA_ATTACK],
    },
  }),
  monk: martial({
    unarmoredDefense: { ability: "wis", allowsShield: false },
    features: {
      1: [
        feature("unarmored-defense", "Unarmored Defense"),
        feature("martial-arts", "Martial Arts"),
      ],
      2: [feature("ki", "Ki"), feature("unarmored-movement", "Unarmored Movement")],
      3: [
        feature("monastic-tradition", "Monastic Tradition"),
        feature("deflect-missiles", "Deflect Missiles"),
      ],
      4: [IMPROVEMENT, feature("slow-fall", "Slow Fall")],
      5: [EXTRA_ATTACK, feature("stunning-strike", "Stunning Strike")],
    },
  }),
  paladin: martial({
    spellcasting: {
      ability: "cha",
      progression: "half",
      cantripsKnown: [0, 0, 0, 0, 0],
      spells: { kind: "prepared", levelDivisor: 2 },
    },
    features: {
      1: [feature("divine-sense", "Divine Sense"), feature("lay-on-hands", "Lay on Hands")],
      2: [FIGHTING_STYLE, SPELLCASTING, feature("divine-smite", "Divine Smite")],
      3: [feature("divine-health", "Divine Health"), feature("sacred-oath", "Sacred Oath")],
      4: [IMPROVEMENT],
      5: [EXTRA_ATTACK],
    },
  }),
  ranger: martial({
    spellcasting: {
      ability: "wis",
      progression: "half",
      cantripsKnown: [0, 0, 0, 0, 0],
      spells: { kind: "known", counts: [0, 2, 3, 3, 4] },
    },
    features: {
      1: [
        feature("favored-enemy", "Favored Enemy"),
        feature("natural-explorer", "Natural Explorer"),
      ],
      2: [FIGHTING_STYLE, SPELLCASTING],
      3: [
        feature("ranger-archetype", "Ranger Archetype"),
        feature("primeval-awareness", "Primeval Awareness"),
      ],
      4: [IMPROVEMENT],
      5: [EXTRA_ATTACK],
    },
  }),
  rogue: martial({
    abilityScoreImprovementLevels: [4, 8, 10, 12, 16, 19],
    expertise: { 1: 2 },
    features: {
      1: [
        feature("expertise", "Expertise"),
        feature("sneak-attack", "Sneak Attack"),
        feature("thieves-cant", "Thieves' Cant"),
      ],
      2: [feature("cunning-action", "Cunning Action")],
      3: [feature("roguish-archetype", "Roguish Archetype")],
      4: [IMPROVEMENT],
      5: [feature("uncanny-dodge", "Uncanny Dodge")],
    },
  }),
  sorcerer: martial({
    subclassLevel: 1,
    spellcasting: {
      ability: "cha",
      progression: "full",
      cantripsKnown: [4, 4, 4, 5, 5],
      spells: { kind: "known", counts: [2, 3, 4, 5, 6] },
    },
    features: {
      1: [SPELLCASTING, feature("sorcerous-origin", "Sorcerous Origin")],
      2: [feature("font-of-magic", "Font of Magic")],
      3: [feature("metamagic", "Metamagic")],
      4: [IMPROVEMENT],
      5: [],
    },
  }),
  warlock: martial({
    subclassLevel: 1,
    spellcasting: {
      ability: "cha",
      progression: "pact",
      cantripsKnown: [2, 2, 2, 3, 3],
      spells: { kind: "known", counts: [2, 3, 4, 5, 6] },
    },
    features: {
      1: [
        feature("otherworldly-patron", "Otherworldly Patron"),
        feature("pact-magic", "Pact Magic"),
      ],
      2: [feature("eldritch-invocations", "Eldritch Invocations")],
      3: [feature("pact-boon", "Pact Boon")],
      4: [IMPROVEMENT],
      5: [],
    },
  }),
  wizard: martial({
    subclassLevel: 2,
    spellcasting: {
      ability: "int",
      progression: "full",
      cantripsKnown: [3, 3, 3, 4, 4],
      spells: { kind: "prepared", levelDivisor: 1 },
    },
    features: {
      1: [SPELLCASTING, feature("arcane-recovery", "Arcane Recovery")],
      2: [feature("arcane-tradition", "Arcane Tradition")],
      3: [],
      4: [IMPROVEMENT],
      5: [],
    },
  }),
};

/** Traits d'espèce du SRD qui donnent une maîtrise de compétence ou des PV par niveau. */
export const SPECIES_TRAIT_SKILLS: Readonly<Record<string, readonly Skill[]>> = {
  "keen-senses": ["perception"],
  menacing: ["intimidation"],
};
export const SPECIES_TRAIT_HIT_POINTS_PER_LEVEL: Readonly<Record<string, number>> = {
  "dwarven-toughness": 1,
};

/** Progression d'une classe ; lève une erreur pour une classe inconnue. */
export function classProgression(classIndex: string): ClassProgression {
  const progression = CLASS_PROGRESSIONS[classIndex];
  if (!progression) throw new RangeError(`Classe inconnue : « ${classIndex} »`);
  return progression;
}

function levelIndex(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > MAX_SUPPORTED_LEVEL) {
    throw new RangeError(
      `Niveau non pris en charge : ${level} (attendu : 1 à ${MAX_SUPPORTED_LEVEL})`,
    );
  }
  return level - 1;
}

/** Nombre de sorts mineurs connus au niveau donné. */
export function cantripsKnown(spellcasting: ClassSpellcasting, level: number): number {
  return spellcasting.cantripsKnown[levelIndex(level)] ?? 0;
}

/** Nombre maximal de sorts connus ou préparés au niveau donné. */
export function maxSpells(
  spellcasting: ClassSpellcasting,
  level: number,
  abilityModifier: number,
): number {
  const index = levelIndex(level);
  if (spellcasting.spells.kind === "known") return spellcasting.spells.counts[index] ?? 0;
  if (spellcasting.progression === "half" && level === 1) return 0;
  return Math.max(1, abilityModifier + Math.floor(level / spellcasting.spells.levelDivisor));
}

/** Nombre total de compétences avec expertise jusqu'au niveau donné. */
export function expertiseCount(progression: ClassProgression, level: number): number {
  return Object.entries(progression.expertise)
    .filter(([gainedAt]) => Number(gainedAt) <= level)
    .reduce((total, [, count]) => total + count, 0);
}
