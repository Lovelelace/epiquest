# @epiquest/server

API HTTP et temps réel du produit, avec [NestJS](https://nestjs.com) et
[Socket.IO](https://socket.io). Le serveur fait autorité : jets de dés, actions de combat et
permissions sont calculés et vérifiés ici (règles SEC-01 à SEC-03).

## Organisation

```text
src/
├── features/          un dossier par feature (voir features/README.md)
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
