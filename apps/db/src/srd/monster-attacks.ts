import {
  actionEffectsSchema,
  damageTypeSchema,
  type ActionEffects,
  type AttackEffect,
  type DamageEffect,
} from "@epiquest/schemas";
import { z } from "zod";

/** Action de monstre telle qu'elle figure dans la source (champ `actions`). */
export const sourceMonsterActionSchema = z.looseObject({
  name: z.string(),
  desc: z.string(),
  attack_bonus: z.number().int().optional(),
  damage: z.array(z.looseObject({})).optional(),
});
export type SourceMonsterAction = z.infer<typeof sourceMonsterActionSchema>;

const sourceDamageSchema = z.object({
  damage_dice: z.string(),
  damage_type: z.looseObject({ index: damageTypeSchema }),
  /** Présent quand ces dégâts dépendent d'un jet de sauvegarde, et non du coup. */
  dc: z.unknown().optional(),
});

/**
 * Résultat de la conversion d'une action :
 * - `full` : jet d'attaque et dégâts convertis, rien d'autre dans le texte ;
 * - `partial` : jet d'attaque et dégâts convertis, mais le texte décrit un effet en plus
 *   (état, jet de sauvegarde…) que le MJ applique à la main ;
 * - `none` : action non convertie, consultable en texte seul (`reason` explique pourquoi).
 */
export interface MonsterAction {
  name: string;
  description: string;
  conversion: "full" | "partial" | "none";
  effects: ActionEffects | null;
  reason?: string;
}

const ATTACK_HEADER = /^(Melee or Ranged|Melee|Ranged) (Weapon|Spell) Attack: [+-]\d+ to hit/;
const REACH = /reach (\d+) ft\./;
const RANGE = /range (\d+)(?:\/(\d+))? ft\./;
/** Fin attendue d'une attaque sans effet en plus : « … slashing damage. » ou « … plus 7 (2d6) fire damage. » */
const ONLY_DAMAGE_AFTER_HIT = /Hit: (?:\d+ (?:\([^)]*\) )?[a-z]+ damage(?:,| plus| and|\s)*)+\.$/;

const damageChoiceSchema = z.looseObject({
  choose: z.number(),
  from: z.looseObject({ options: z.array(z.looseObject({})).min(1) }),
});

/**
 * Dégâts au choix (arme polyvalente : à une ou deux mains) : on garde la première option de la
 * source, l'autre reste dans le texte et la conversion est marquée partielle.
 */
function firstOption(damage: Record<string, unknown>): Record<string, unknown> {
  const choice = damageChoiceSchema.safeParse(damage);
  return choice.success ? (choice.data.from.options[0] ?? damage) : damage;
}

function kindOf(header: RegExpExecArray): AttackEffect["kind"] {
  const [, distance, source] = header;
  if (distance === "Melee or Ranged") return "melee_or_ranged_weapon";
  if (distance === "Melee") return source === "Weapon" ? "melee_weapon" : "melee_spell";
  return source === "Weapon" ? "ranged_weapon" : "ranged_spell";
}

function unconverted(action: SourceMonsterAction, reason: string): MonsterAction {
  return { name: action.name, description: action.desc, conversion: "none", effects: null, reason };
}

/** Convertit une action de monstre en effets, ou explique pourquoi elle ne l'est pas. */
export function convertMonsterAction(action: SourceMonsterAction): MonsterAction {
  if (action.attack_bonus === undefined) return unconverted(action, "pas de jet d'attaque");
  const description = action.desc.trim();
  const header = ATTACK_HEADER.exec(description);
  if (!header) return unconverted(action, "type d'attaque non reconnu");

  const damages = z.array(sourceDamageSchema).min(1).safeParse(action.damage?.map(firstOption));
  if (!damages.success) return unconverted(action, "dégâts absents ou non reconnus");
  const hasChoice = action.damage?.some((damage) => damage !== firstOption(damage)) ?? false;

  const reach = REACH.exec(description);
  const range = RANGE.exec(description);
  const hitDamages = damages.data.filter((damage) => damage.dc === undefined);
  if (hitDamages.length === 0) return unconverted(action, "dégâts soumis à une sauvegarde");
  const onHit: DamageEffect[] = hitDamages.map((damage) => ({
    type: "damage",
    dice: damage.damage_dice,
    damageType: damage.damage_type.index,
  }));
  const result = actionEffectsSchema.safeParse({
    activation: "action",
    effects: [
      {
        type: "attack",
        kind: kindOf(header),
        attackBonus: action.attack_bonus,
        reach: reach ? Number(reach[1]) : undefined,
        range: range
          ? { normal: Number(range[1]), long: range[2] ? Number(range[2]) : undefined }
          : undefined,
        onHit,
      },
    ],
  });
  if (!result.success) return unconverted(action, "effets invalides");

  return {
    name: action.name,
    description: action.desc,
    conversion:
      ONLY_DAMAGE_AFTER_HIT.test(description) &&
      hitDamages.length === damages.data.length &&
      !hasChoice
        ? "full"
        : "partial",
    effects: result.data,
  };
}

/** Bilan de la conversion des attaques, affiché à la fin de l'import. */
export interface MonsterAttackReport {
  /** Actions avec un bonus d'attaque dans la source. */
  attacks: number;
  full: number;
  partial: number;
  unconverted: { monster: string; action: string; reason: string }[];
}

/** Calcule le bilan de la conversion des attaques pour les monstres de la source. */
export function reportMonsterAttacks(
  monsters: { index: string; actions: SourceMonsterAction[] }[],
): MonsterAttackReport {
  const report: MonsterAttackReport = { attacks: 0, full: 0, partial: 0, unconverted: [] };
  for (const monster of monsters) {
    for (const action of monster.actions.filter(
      (candidate) => candidate.attack_bonus !== undefined,
    )) {
      const converted = convertMonsterAction(action);
      report.attacks += 1;
      if (converted.conversion === "full") report.full += 1;
      else if (converted.conversion === "partial") report.partial += 1;
      else {
        report.unconverted.push({
          monster: monster.index,
          action: action.name,
          reason: converted.reason ?? "",
        });
      }
    }
  }
  return report;
}
