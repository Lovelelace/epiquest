import { actionEffectsSchema } from "@epiquest/schemas";
import { describe, expect, it } from "vitest";
import { convertMonsterAction, reportMonsterAttacks } from "./monster-attacks.js";
import { loadSrdSource } from "./source.js";

const source = loadSrdSource();

/** Action d'un monstre du SRD, convertie. */
function convert(monster: string, action: string) {
  const found = source.monsters
    .find((candidate) => candidate.index === monster)
    ?.actions.find((candidate) => candidate.name === action);
  if (!found) throw new Error(`Action introuvable : ${monster} / ${action}`);
  return convertMonsterAction(found);
}

describe("convertMonsterAction", () => {
  it("convertit une attaque au corps à corps (gobelin, cimeterre)", () => {
    expect(convert("goblin", "Scimitar")).toMatchObject({
      conversion: "full",
      effects: {
        activation: "action",
        effects: [
          {
            type: "attack",
            kind: "melee_weapon",
            attackBonus: 4,
            reach: 5,
            onHit: [{ type: "damage", dice: "1d6+2", damageType: "slashing" }],
          },
        ],
      },
    });
  });

  it("convertit une attaque à distance avec portée longue (gobelin, arc court)", () => {
    expect(convert("goblin", "Shortbow").effects?.effects[0]).toMatchObject({
      kind: "ranged_weapon",
      range: { normal: 80, long: 320 },
    });
  });

  it("convertit une arme de lancer (garde, lance)", () => {
    expect(convert("guard", "Spear").effects?.effects[0]).toMatchObject({
      kind: "melee_or_ranged_weapon",
      reach: 5,
      range: { normal: 20, long: 60 },
    });
  });

  it("garde tous les dégâts d'une attaque à dégâts multiples (balor, épée longue)", () => {
    const longsword = convert("balor", "Longsword");
    expect(longsword.effects?.effects[0]).toMatchObject({
      onHit: [
        { dice: "3d8+8", damageType: "slashing" },
        { dice: "3d8", damageType: "lightning" },
      ],
    });
  });

  it("signale un effet en plus dans le texte comme conversion partielle (ankheg, morsure)", () => {
    expect(convert("ankheg", "Bite").conversion).toBe("partial");
  });

  it("accepte l'allonge nulle des nuées", () => {
    expect(convert("swarm-of-rats", "Bites").effects?.effects[0]).toMatchObject({ reach: 0 });
  });

  it("n'ajoute pas au coup les dégâts qui dépendent d'une sauvegarde", () => {
    const converted = convertMonsterAction({
      name: "Poisoned Bolt",
      desc: "Ranged Weapon Attack: +6 to hit, range 80/320 ft., one target. Hit: 7 (1d8 + 3) piercing damage, and the target must make a DC 15 Constitution saving throw, taking 24 (7d6) poison damage on a failed save.",
      attack_bonus: 6,
      damage: [
        { damage_dice: "1d8+3", damage_type: { index: "piercing" } },
        { damage_dice: "7d6", damage_type: { index: "poison" }, dc: { dc_value: 15 } },
      ],
    });
    expect(converted.conversion).toBe("partial");
    expect(converted.effects?.effects[0]).toMatchObject({
      onHit: [{ dice: "1d8+3", damageType: "piercing" }],
    });
  });

  it("garde la première option des dégâts au choix, en conversion partielle (garde, lance)", () => {
    expect(convert("guard", "Spear")).toMatchObject({
      conversion: "partial",
      effects: { effects: [{ onHit: [{ dice: "1d6+1", damageType: "piercing" }] }] },
    });
  });

  it("laisse en texte seul une action qui n'est pas une attaque (balor, multiattaque)", () => {
    expect(convert("balor", "Multiattack")).toMatchObject({ conversion: "none", effects: null });
  });

  it("produit des effets valides pour toutes les attaques converties du SRD", () => {
    for (const monster of source.monsters) {
      for (const action of monster.actions) {
        const { effects } = convertMonsterAction(action);
        if (effects) expect(actionEffectsSchema.safeParse(effects).success).toBe(true);
      }
    }
  });
});

describe("reportMonsterAttacks", () => {
  it("compte les attaques converties et liste celles qui ne le sont pas", () => {
    const report = reportMonsterAttacks(source.monsters);
    expect(report.attacks).toBe(534);
    expect(report.full + report.partial + report.unconverted.length).toBe(report.attacks);
    expect(report.unconverted.map((entry) => entry.action)).toContain("Ink Cloud");
    // Seuil de non-régression : plus de 90 % des attaques du SRD sont converties.
    expect((report.full + report.partial) / report.attacks).toBeGreaterThan(0.9);
  });
});
