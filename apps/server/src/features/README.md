# Features du serveur

Un dossier par feature (par exemple `characters/`), qui contient tout ce qui la concerne :

```text
features/<feature>/
├── <feature>.module.ts        module NestJS, importé dans app.module.ts
├── <feature>.controller.ts    routes HTTP
├── <feature>.gateway.ts       événements Socket.IO (si besoin)
├── <feature>.service.ts       orchestration : validation, appel du moteur, accès à la base
└── *.test.ts                  tests, à côté du code testé
```

Règles :

- Une feature n'importe pas les fichiers internes d'une autre feature : elle passe par le service
  que l'autre module exporte (ARCH-14).
- Les tables de la feature sont déclarées dans `apps/db/src/schema/<feature>.ts`.
- Les contrats échangés avec le web et le mobile sont dans `packages/schemas`.
- Les calculs de règles sont dans `packages/rules`, en fonctions pures.

Ce qui sert à plusieurs features (configuration, base, santé, temps réel de base) est dans
`src/shared/`.
