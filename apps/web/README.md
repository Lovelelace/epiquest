# @epiquest/web

Client web du produit : création et fiche de personnage, vue MJ et vue joueurs (second écran),
avec [Next.js](https://nextjs.org) (App Router) et [Tailwind CSS](https://tailwindcss.com).
Next.js ne contient aucune logique serveur : toutes les données passent par l'API NestJS
(`NEXT_PUBLIC_API_URL`).

## Organisation

```text
src/
├── app/               routes (App Router), minces : elles assemblent les composants des features
├── features/          un dossier par feature (voir features/README.md)
└── shared/
    ├── components/    composants d'interface accessibles réutilisables
    └── lib/           utilitaires transverses (URL de l'API…)
```

## Commandes

| Commande                            | Rôle                                               |
| ----------------------------------- | -------------------------------------------------- |
| `pnpm --filter @epiquest/web dev`   | Serveur de développement sur http://localhost:3001 |
| `pnpm --filter @epiquest/web test`  | Tests (Vitest, Testing Library, contrôle axe)      |
| `pnpm --filter @epiquest/web build` | Build de production                                |
| `pnpm --filter @epiquest/web start` | Lance le build de production                       |

Variables d'environnement : `NEXT_PUBLIC_API_URL` (voir `.env.example`).
