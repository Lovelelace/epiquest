# Features du web

Un dossier par feature (par exemple `characters/`), qui contient ses composants, ses hooks, ses
appels à l'API et ses tests :

```text
features/<feature>/
├── components/     composants propres à la feature
├── api.ts          appels à l'API NestJS (contrats de @epiquest/schemas)
└── *.test.tsx      tests, à côté du code testé
```

Les routes Next.js restent dans `src/app/` et restent minces : une page importe les composants
de sa feature et les assemble. Les vues MJ et joueurs sont des routes de cette même app.

Règles :

- Une feature n'importe pas les fichiers internes d'une autre feature (ARCH-14).
- Next.js n'affiche que l'interface : pas de route handler (`route.ts`), pas de server action,
  aucune logique métier. Toutes les données passent par l'API NestJS.
- Ce qui sert à plusieurs features (composants accessibles de base, client API) est dans
  `src/shared/`.
