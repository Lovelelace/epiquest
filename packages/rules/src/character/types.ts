import type { Ability } from "../abilities.js";
import type { Skill } from "./skills.js";

/** Valeur de chacune des six caractéristiques. */
export type AbilityScores = Record<Ability, number>;

/** Origine d'un bonus de caractéristique, pour l'afficher et le valider. */
export type AbilityBonusSource = "species" | "background" | "ability-score-improvement";

export interface AbilityBonus {
  ability: Ability;
  amount: number;
  source: AbilityBonusSource;
}

/** Données SRD d'une armure, réduites à ce que le moteur utilise. */
export interface ArmorData {
  category: "light" | "medium" | "heavy";
  baseArmorClass: number;
  /** Plafond du modificateur de Dextérité ajouté à la CA, `null` si aucun plafond. */
  dexterityCap: number | null;
  /** Force minimale pour porter l'armure sans perdre de vitesse, `null` si aucune. */
  strengthRequirement: number | null;
  hasStealthDisadvantage: boolean;
}

/** Défense sans armure d'une classe (barbare : Constitution, moine : Sagesse). */
export interface UnarmoredDefense {
  ability: Ability;
  allowsShield: boolean;
}

export type SpellcastingProgression = "full" | "half" | "pact";

export interface ClassData {
  index: string;
  hitDie: number;
  savingThrows: readonly Ability[];
  spellcasting: { ability: Ability; progression: SpellcastingProgression } | null;
  unarmoredDefense: UnarmoredDefense | null;
}

export interface SpeciesData {
  index: string;
  speed: number;
  /** PV supplémentaires par niveau (Robustesse naine). */
  hitPointBonusPerLevel: number;
}

/** Bonus de CA hors armure et bouclier (style de combat Défense, objet magique…). */
export interface ArmorClassBonus {
  source: string;
  amount: number;
  requiresArmor: boolean;
}

/** Personnage dont les choix sont résolus avec les données SRD : entrée du moteur. */
export interface CharacterBuild {
  level: number;
  classData: ClassData;
  species: SpeciesData;
  baseAbilityScores: AbilityScores;
  abilityBonuses: readonly AbilityBonus[];
  skillProficiencies: readonly Skill[];
  skillExpertise: readonly Skill[];
  /** Résultat du dé de vie (jet ou moyenne) pour chaque niveau après le premier. */
  hitPointGains: readonly number[];
  armor: ArmorData | null;
  hasShield: boolean;
  armorClassBonuses: readonly ArmorClassBonus[];
  /** Poids total porté, en livres. */
  carriedWeight: number;
}
