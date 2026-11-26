# @epiquest/server

API HTTP et temps réel du produit, avec [NestJS](https://nestjs.com) et
[Socket.IO](https://socket.io). Le serveur fait autorité : jets de dés, actions de combat et
permissions sont calculés et vérifiés ici (règles SEC-01 à SEC-03).

## Organisation

```text
src/
├── features/          un dossier par feature (voir features/README.md)
│   └── srd/           consultation des données du SRD (GET /srd/...)
├── shared/
│   ├── config/        lecture et validation des variables d'environnement
│   ├── database/      connexion Drizzle (jeton DATABASE), fournie par @epiquest/db
│   ├── health/        GET /health
│   └── realtime/      adaptateur Socket.IO (CORS) et passerelle de test ping/pong
├── app.module.ts      module racine : importe les modules partagés et ceux des features
└── main.ts            démarrage
```

## Commandes

| Commande                               | Rôle                                            |
| -------------------------------------- | ----------------------------------------------- |
| `pnpm --filter @epiquest/server dev`   | Serveur en mode watch sur http://localhost:3000 |
| `pnpm --filter @epiquest/server test`  | Tests (Vitest + SWC pour les décorateurs)       |
| `pnpm --filter @epiquest/server build` | Compile vers `dist/`                            |
| `pnpm --filter @epiquest/server start` | Lance la version compilée                       |

Variables d'environnement : `PORT`, `DATABASE_URL`, `WEB_ORIGIN` (voir `.env.example`).

## Routes

Les réponses sont validées par les contrats de `@epiquest/schemas`. Les erreurs ont la forme
`{ code, message, details? }`.

### `GET /health`

Répond `{ "status": "ok" }`.

### Consultation du SRD

Données publiques en lecture seule. `<entité>` vaut `species`, `classes`, `subclasses`,
`backgrounds`, `spells`, `items`, `monsters` ou `conditions`.

| Route                      | Rôle                                                     |
| -------------------------- | -------------------------------------------------------- |
| `GET /srd/<entité>`        | Liste paginée : `{ items, page, pageSize, total }`       |
| `GET /srd/<entité>/<slug>` | Détail : résumé, `description` et `data` (entrée source) |
| `GET /srd/version`         | Version du SRD importée (dépôt, tag, commit, date)       |

Paramètres des listes :

| Paramètre                                  | Entités                | Rôle                                                                           |
| ------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------ |
| `q`                                        | toutes                 | Recherche plein texte (nom et description) ou début du nom, tri par pertinence |
| `page`                                     | toutes                 | Numéro de page, à partir de 1 (défaut 1)                                       |
| `pageSize`                                 | toutes                 | Entrées par page, de 1 à 100 (défaut 20)                                       |
| `class`                                    | `spells`, `subclasses` | Slug de la classe (`wizard`)                                                   |
| `level`                                    | `spells`               | Niveau, de 0 (sort mineur) à 9                                                 |
| `school`                                   | `spells`               | École (`evocation`)                                                            |
| `kind`                                     | `items`                | `equipment` ou `magic_item`                                                    |
| `category`                                 | `items`                | Catégorie (`weapon`, `armor`…)                                                 |
| `rarity`                                   | `items`                | Rareté (`rare`, `very rare`…)                                                  |
| `type`                                     | `monsters`             | Type de créature (`humanoid`)                                                  |
| `size`                                     | `monsters`             | Taille (`tiny` à `gargantuan`)                                                 |
| `minChallengeRating`, `maxChallengeRating` | `monsters`             | Bornes du facteur de puissance (1/4 = `0.25`)                                  |

Exemple : `GET /srd/spells?class=wizard&level=3&q=fire`.

Codes d'erreur : `INVALID_QUERY` (400, paramètre invalide, détail par champ dans `details`),
`SRD_ENTITY_NOT_FOUND` (404, entité inconnue), `SRD_ENTRY_NOT_FOUND` (404, slug inconnu),
`SRD_NOT_IMPORTED` (404, version demandée avant tout import).
