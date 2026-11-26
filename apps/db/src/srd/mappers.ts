import type {
  NewSrdBackground,
  NewSrdClass,
  NewSrdCondition,
  NewSrdItem,
  NewSrdMonster,
  NewSrdSpecies,
  NewSrdSpell,
  NewSrdSubclass,
} from "../schema/index.js";
import { convertMonsterAction } from "./monster-attacks.js";
import type { SrdSource } from "./source.js";

type Entry<K extends keyof SrdSource> = SrdSource[K][number];
type Size = NonNullable<NewSrdSpecies["size"]>;

const SIZES: readonly Size[] = ["tiny", "small", "medium", "large", "huge", "gargantuan"];

/** Assemble les paragraphes de la source, séparés par une ligne vide. */
export function joinParagraphs(text: string | string[] | null | undefined): string {
  if (text == null) return "";
  return typeof text === "string" ? text : text.join("\n\n");
}

/** Convertit une taille de la source (« Medium ») vers l'enum de la base. */
export function toSize(size: string): Size {
  const normalized = size.toLowerCase();
  const match = SIZES.find((candidate) => candidate === normalized);
  if (!match) throw new Error(`Taille inconnue dans le SRD : « ${size} »`);
  return match;
}

function base(entry: Entry<keyof SrdSource>, description: string) {
  return { slug: entry.index, name: entry.name, description, raw: entry };
}

export function mapRace(race: Entry<"races">): NewSrdSpecies {
  return { ...base(race, ""), size: toSize(race.size), speed: race.speed };
}

/** Une sous-espèce garde la taille et la vitesse de son espèce parente : colonnes laissées vides. */
export function mapSubrace(subrace: Entry<"subraces">, parentId: string): NewSrdSpecies {
  return { ...base(subrace, joinParagraphs(subrace.desc)), parentId };
}

export function mapClass(srdClass: Entry<"classes">): NewSrdClass {
  return { ...base(srdClass, ""), hitDie: srdClass.hit_die };
}

export function mapSubclass(subclass: Entry<"subclasses">, classId: string): NewSrdSubclass {
  return { ...base(subclass, joinParagraphs(subclass.desc)), classId };
}

export function mapBackground(background: Entry<"backgrounds">): NewSrdBackground {
  return base(background, joinParagraphs(background.feature?.desc));
}

export function mapSpell(spell: Entry<"spells">): NewSrdSpell {
  return {
    ...base(spell, joinParagraphs(spell.desc)),
    level: spell.level,
    school: spell.school.index,
    castingTime: spell.casting_time,
    range: spell.range,
    duration: spell.duration,
    isRitual: spell.ritual,
    requiresConcentration: spell.concentration,
  };
}

export function mapEquipment(item: Entry<"equipment">): NewSrdItem {
  return {
    ...base(item, joinParagraphs(item.desc)),
    kind: "equipment",
    category: item.equipment_category.index,
  };
}

export function mapMagicItem(item: Entry<"magicItems">): NewSrdItem {
  return {
    ...base(item, joinParagraphs(item.desc)),
    kind: "magic_item",
    category: item.equipment_category.index,
    rarity: item.rarity.name.toLowerCase(),
  };
}

export function mapMonster(monster: Entry<"monsters">): NewSrdMonster {
  const [armorClass] = monster.armor_class;
  if (!armorClass) throw new Error(`Classe d'armure manquante : ${monster.index}`);
  return {
    ...base(monster, joinParagraphs(monster.desc)),
    size: toSize(monster.size),
    type: monster.type,
    challengeRating: monster.challenge_rating,
    armorClass: armorClass.value,
    hitPoints: monster.hit_points,
    actions: monster.actions.map(convertMonsterAction),
  };
}

export function mapCondition(condition: Entry<"conditions">): NewSrdCondition {
  return base(condition, joinParagraphs(condition.desc));
}
