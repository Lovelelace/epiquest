import type { ActionEffectsInput } from "../effects.js";

/** Exemples tirés du SRD 5.1, vérifiés à la main contre le texte des règles. */
export const validActions: Record<string, ActionEffectsInput> = {
  // Attaque de monstre : bonus fixe, dégâts d'arme.
  "goblin-scimitar": {
    activation: "action",
    effects: [
      {
        type: "attack",
        kind: "melee_weapon",
        attackBonus: 4,
        reach: 5,
        onHit: [{ type: "damage", dice: "1d6 + 2", damageType: "slashing" }],
      },
    ],
  },
  // Attaque à distance avec portée longue.
  "goblin-shortbow": {
    activation: "action",
    effects: [
      {
        type: "attack",
        kind: "ranged_weapon",
        attackBonus: 4,
        range: { normal: 80, long: 320 },
        onHit: [{ type: "damage", dice: "1d6 + 2", damageType: "piercing" }],
      },
    ],
  },
  // Arme de lancer : au contact ou à distance.
  "bandit-dagger": {
    activation: "action",
    effects: [
      {
        type: "attack",
        kind: "melee_or_ranged_weapon",
        attackBonus: 3,
        reach: 5,
        range: { normal: 20, long: 60 },
        onHit: [{ type: "damage", dice: "1d4 + 1", damageType: "piercing" }],
      },
    ],
  },
  // Nuée : allonge nulle, la cible doit être dans son espace.
  "swarm-of-rats-bites": {
    activation: "action",
    effects: [
      {
        type: "attack",
        kind: "melee_weapon",
        attackBonus: 2,
        reach: 0,
        onHit: [{ type: "damage", dice: "2d6", damageType: "piercing" }],
      },
    ],
  },
  // Sauvegarde, zone, moitié des dégâts en cas de réussite, dés par niveau d'emplacement.
  fireball: {
    activation: "action",
    range: 150,
    area: { shape: "sphere", size: 20 },
    effects: [
      {
        type: "saving_throw",
        ability: "dex",
        onFail: [{ type: "damage", dice: "8d6", damageType: "fire", perSlotLevel: "1d6" }],
        halfDamageOnSuccess: true,
      },
    ],
  },
  // Attaque de sort, effet à l'échec (moitié des dégâts initiaux exprimée directement).
  "acid-arrow": {
    activation: "action",
    range: 90,
    effects: [
      {
        type: "attack",
        kind: "ranged_spell",
        onHit: [{ type: "damage", dice: "4d4", damageType: "acid", perSlotLevel: "1d4" }],
        onMiss: [{ type: "damage", dice: "2d4", damageType: "acid" }],
      },
    ],
  },
  // Soins avec modificateur de caractéristique.
  "cure-wounds": {
    activation: "action",
    range: "touch",
    effects: [{ type: "healing", dice: "1d8", addAbilityModifier: true, perSlotLevel: "1d8" }],
  },
  // État avec durée, sauvegarde répétée et concentration.
  "hold-person": {
    activation: "action",
    range: 60,
    requiresConcentration: true,
    effects: [
      {
        type: "saving_throw",
        ability: "wis",
        onFail: [
          {
            type: "apply_condition",
            condition: "paralyzed",
            duration: { amount: 1, unit: "minute" },
            repeatSave: true,
          },
        ],
      },
    ],
  },
  // Modificateur en dés sur les jets d'attaque et de sauvegarde.
  bless: {
    activation: "action",
    range: 30,
    requiresConcentration: true,
    effects: [
      {
        type: "modifier",
        target: "attack_roll",
        value: "1d4",
        duration: { amount: 1, unit: "minute" },
      },
      {
        type: "modifier",
        target: "saving_throw",
        value: "1d4",
        duration: { amount: 1, unit: "minute" },
      },
    ],
  },
  // Modificateur fixe : bonus à la CA.
  "shield-of-faith": {
    activation: "bonus_action",
    range: 60,
    requiresConcentration: true,
    effects: [
      {
        type: "modifier",
        target: "armor_class",
        value: 2,
        duration: { amount: 10, unit: "minute" },
      },
    ],
  },
};

/** Entrées refusées, avec la raison attendue. */
export const invalidActions: Record<string, unknown> = {
  "aucun effet": { activation: "action", effects: [] },
  "type d'effet inconnu": { activation: "action", effects: [{ type: "teleport" }] },
  "dés invalides": {
    activation: "action",
    effects: [{ type: "damage", dice: "2d", damageType: "fire" }],
  },
  "type de dégâts inconnu": {
    activation: "action",
    effects: [{ type: "damage", dice: "1d6", damageType: "holy" }],
  },
  "soins sans dés": { activation: "action", effects: [{ type: "healing" }] },
  "état inconnu": {
    activation: "action",
    effects: [{ type: "apply_condition", condition: "asleep" }],
  },
  "modificateur sans cible": {
    activation: "action",
    effects: [{ type: "modifier", value: 2 }],
  },
  "attaque sans conséquence": {
    activation: "action",
    effects: [{ type: "attack", kind: "melee_weapon", onHit: [] }],
  },
  "attaque imbriquée dans une attaque": {
    activation: "action",
    effects: [
      {
        type: "attack",
        kind: "melee_weapon",
        onHit: [{ type: "attack", kind: "melee_weapon", onHit: [] }],
      },
    ],
  },
  "sauvegarde sur une caractéristique inconnue": {
    activation: "action",
    effects: [
      {
        type: "saving_throw",
        ability: "luck",
        onFail: [{ type: "damage", dice: "1d6", damageType: "fire" }],
      },
    ],
  },
  "allonge négative": {
    activation: "action",
    effects: [
      {
        type: "attack",
        kind: "melee_weapon",
        reach: -5,
        onHit: [{ type: "damage", dice: "1d4", damageType: "piercing" }],
      },
    ],
  },
  "portée négative": {
    activation: "action",
    range: -5,
    effects: [{ type: "healing", dice: "1d4" }],
  },
  "activation inconnue": { activation: "free", effects: [{ type: "healing", dice: "1d4" }] },
};
