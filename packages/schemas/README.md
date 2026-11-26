# @epiquest/schemas

Contrats de données partagés entre le serveur, le web et le mobile (règles DATA-01 à DATA-04).
Chaque schéma est écrit avec [zod](https://zod.dev) ; les types TypeScript en sont déduits avec
`z.infer`, jamais réécrits à la main.

## Organisation

- Un fichier par domaine : `src/<feature>.ts` (par exemple `src/characters.ts`), avec ses tests
  `src/<feature>.test.ts`.
- Tout ce qui est public est réexporté par `src/index.ts`. Les autres paquets et apps
  n'importent que `@epiquest/schemas`.
- Une modification d'un schéma passe par une PR dédiée (DATA-03).

## Format des effets

`actionEffectsSchema` décrit ce que fait un sort, une capacité ou une attaque quand on l'utilise.
Choix et limites : [ADR 0003](../../docs/adr/0003-format-des-effets.md). Exemples testés :
`src/fixtures/effects.ts`.

```ts
// Fireball : sauvegarde de Dextérité, 8d6 feu (+1d6 par niveau d'emplacement), moitié si réussite.
const fireball: ActionEffectsInput = {
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
};
```

| Effet             | Rôle                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| `attack`          | Jet d'attaque ; `onHit` et `onMiss` listent les conséquences            |
| `saving_throw`    | Jet de sauvegarde imposé ; `onFail`, `onSuccess`, `halfDamageOnSuccess` |
| `damage`          | Dégâts en dés, type de dégâts, dés par niveau d'emplacement             |
| `healing`         | Soins en dés, modificateur de caractéristique facultatif                |
| `apply_condition` | Applique un état du SRD, avec durée et sauvegarde répétée               |
| `modifier`        | Bonus ou malus (CA, attaque, dégâts, sauvegarde, test, vitesse)         |

Les dés sont écrits en notation standard (`diceNotationSchema` : `2d6 + 3`).

## Commandes

```bash
pnpm --filter @epiquest/schemas test         # tests
pnpm --filter @epiquest/schemas build        # compile vers dist/
```
