# Features du mobile

Un dossier par feature (par exemple `characters/`), qui contient ses écrans, ses composants,
ses appels à l'API et ses tests :

```text
features/<feature>/
├── screens/        écrans de la feature
├── components/     composants propres à la feature
├── api.ts          appels à l'API NestJS (contrats de @epiquest/schemas)
└── *.test.tsx      tests, à côté du code testé
```

Les routes Expo Router restent dans `src/app/` et ne contiennent qu'une réexportation de l'écran
de la feature, par exemple :

```tsx
// src/app/characters/[id].tsx
export { default } from "../../features/characters/screens/CharacterSheetScreen";
```

Expo Router traite **chaque fichier** de `src/app/` comme une route : n'y mettez ni test, ni
composant, ni utilitaire.

Règles :

- Une feature n'importe pas les fichiers internes d'une autre feature (ARCH-14).
- Les calculs de règles viennent de `@epiquest/rules`, le même moteur que le web.
- Ce qui sert à plusieurs features est dans `src/shared/`.
