# @epiquest/db

Tout ce qui concerne PostgreSQL : schéma [Drizzle](https://orm.drizzle.team), migrations, seed de
la campagne de démonstration et import du SRD. Le serveur importe ce paquet pour accéder à la
base (exception à la règle ARCH-06, voir `specs/01-architecture.md`).

## Organisation

```text
src/
├── schema/        un fichier par feature (src/schema/<feature>.ts), réexporté par index.ts
│   └── srd/       entités du SRD 5.1, un fichier par entité
├── seed/          données de la campagne de démonstration (à venir)
├── srd/           import du SRD 5.1, rejouable et versionné (à venir)
├── client.ts      createDatabase(url) : connexion Drizzle + postgres.js
├── env.ts         lecture de DATABASE_URL
└── migrate.ts     applique les migrations (script `migrate`)
migrations/        migrations SQL générées par drizzle-kit (versionnées, jamais modifiées après merge)
drizzle.config.ts  configuration de drizzle-kit
```

## Entités du SRD

Les données du SRD 5.1 (CC BY 4.0, voir `NOTICE.md`) sont rangées dans des tables préfixées
`srd_`. Toutes partagent les mêmes colonnes de base :

| Colonne       | Rôle                                                                       |
| ------------- | -------------------------------------------------------------------------- |
| `id`          | UUID exposé aux clients                                                    |
| `slug`        | Identifiant stable dans la source (`acid-arrow`), unique : clé de l'import |
| `name`        | Nom anglais du SRD                                                         |
| `description` | Texte de règles, paragraphes séparés par une ligne vide                    |
| `raw`         | Entrée source complète (JSON), pour ce qui n'a pas de colonne dédiée       |
| `search`      | `tsvector` calculé (nom en poids A, description en poids B), index GIN     |

| Table               | Entité                  | Colonnes propres                                                                                      |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `srd_species`       | Espèces et sous-espèces | `parent_id` (sous-espèce → espèce), `size`, `speed`                                                   |
| `srd_classes`       | Classes                 | `hit_die` (6, 8, 10 ou 12)                                                                            |
| `srd_subclasses`    | Sous-classes            | `class_id`                                                                                            |
| `srd_backgrounds`   | Historiques             | aucune                                                                                                |
| `srd_spells`        | Sorts                   | `level` (0 à 9), `school`, `casting_time`, `range`, `duration`, `is_ritual`, `requires_concentration` |
| `srd_spell_classes` | Sorts ↔ classes         | `spell_id`, `class_id` (clé composée)                                                                 |
| `srd_items`         | Objets                  | `kind` (`equipment` ou `magic_item`), `category`, `rarity`                                            |
| `srd_monsters`      | Monstres                | `size`, `type`, `challenge_rating` (décimal : 1/8 = 0,125), `armor_class`, `hit_points`               |
| `srd_conditions`    | États                   | aucune                                                                                                |

Les tailles (`srd_size`) sont un enum PostgreSQL commun aux espèces et aux monstres. Supprimer
une classe ou une espèce supprime ses sous-classes, sous-espèces et liens de sorts.

Les types de lignes sont exportés par le paquet (`SrdSpell`, `NewSrdSpell`, `SrdMonster`…),
déduits du schéma Drizzle.

Recherche plein texte :

```ts
db.select()
  .from(srdSpells)
  .where(sql`${srdSpells.search} @@ plainto_tsquery('english', ${query})`);
```

## Ajouter ou modifier une table

1. Déclarer la table dans `src/schema/<feature>.ts` et la réexporter dans `src/schema/index.ts`.
2. Générer la migration : `pnpm --filter @epiquest/db generate` (base inutile pour cette étape).
3. Relire le SQL généré dans `migrations/`, puis l'appliquer : `pnpm --filter @epiquest/db migrate`.

Une PR contient au plus une migration. En cas de conflit avec `develop`, on supprime sa
migration, on se remet à jour, puis on la régénère (règle DATA-09).

## Commandes

| Commande                              | Rôle                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `pnpm --filter @epiquest/db generate` | Génère une migration à partir du schéma                    |
| `pnpm --filter @epiquest/db migrate`  | Applique les migrations (`DATABASE_URL` requise)           |
| `pnpm --filter @epiquest/db studio`   | Explorateur de la base (Drizzle Studio)                    |
| `pnpm --filter @epiquest/db test`     | Tests, dont les migrations sur une base embarquée (PGlite) |

Avec Docker Compose, les migrations s'appliquent automatiquement au démarrage (service `migrate`).
