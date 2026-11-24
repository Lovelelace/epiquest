# @epiquest/server

API HTTP et temps réel du produit, avec [NestJS](https://nestjs.com) et
[Socket.IO](https://socket.io). Le serveur fait autorité : jets de dés, actions de combat et
permissions sont calculés et vérifiés ici (règles SEC-01 à SEC-03).

## Organisation

```text
src/
├── features/          un dossier par feature (voir features/README.md)
│   └── table/         synchronisation MJ / joueurs : salles Socket.IO, projection pour les joueurs
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

## Table en temps réel

Chaque connexion Socket.IO s'identifie dans le handshake (`auth: { userId }`), puis rejoint la
salle de sa campagne et de son public avec `table:join` : `campaign:<id>:gm` ou
`campaign:<id>:players`. La salle du MJ reçoit l'état complet (`table:state`), celle des joueurs
la vue projetée par `projectForPlayers` (`table:player-view`), seule fonction qui décide de ce que
voient les joueurs (SEC-09). Les contrats sont dans `@epiquest/schemas` (`src/table.ts`).

Provisoire, en attendant les features comptes et campagnes, puis cartes et brouillard :

- l'identité n'est pas vérifiée : l'annuaire de démonstration (`DemoCampaignMembership`) connaît
  une campagne `5e0c4a3b-2d1f-4e6a-9b8c-7d6e5f4a3b2c`, son MJ `demo-gm` et deux joueurs
  `demo-player-1` et `demo-player-2` ;
- l'état de la table est gardé en mémoire (`InMemoryTableStateStore`) et repart de la carte de
  démonstration à chaque redémarrage.
