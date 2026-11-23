# @epiquest/db

Tout ce qui concerne PostgreSQL : schéma [Drizzle](https://orm.drizzle.team), migrations, seed de
la campagne de démonstration et import du SRD. Le serveur importe ce paquet pour accéder à la
base (exception à la règle ARCH-06, voir `specs/01-architecture.md`).

## Organisation

```text
src/
├── schema/        un fichier par feature (src/schema/<feature>.ts), réexporté par index.ts
├── seed/          données de la campagne de démonstration (à venir)
├── srd/           import du SRD 5.1, rejouable et versionné (à venir)
├── client.ts      createDatabase(url) : connexion Drizzle + postgres.js
├── env.ts         lecture de DATABASE_URL
└── migrate.ts     applique les migrations (script `migrate`)
migrations/        migrations SQL générées par drizzle-kit (versionnées, jamais modifiées après merge)
drizzle.config.ts  configuration de drizzle-kit
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
