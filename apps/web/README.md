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

## Table de jeu (vue MJ et vue joueurs)

- `/campagnes/<id>/mj` : vue MJ (état complet). Le lien « Ouvrir la vue joueurs » ouvre
  `/campagnes/<id>/joueurs` dans une seconde fenêtre, à placer sur un écran partagé.
- Commandes du MJ, toutes au clavier : sélection d'un jeton, déplacement (boutons, ou flèches
  quand un bouton de déplacement a le focus), visibilité, PV, brouillard par zone rectangulaire
  (ou clic sur une case), jets publics ou secrets. Le serveur valide et diffuse chaque action.
- `/campagnes/<id>/joueurs` : vue joueurs en lecture seule, mise à jour en direct par
  Socket.IO. Elle n'affiche que ce que le serveur envoie, déjà filtré.

Provisoire, en attendant les comptes : l'utilisateur est choisi dans l'URL avec
`?utilisateur=` (`demo-gm` par défaut, ou `demo-player-1`, `demo-player-2`). La page d'accueil
mène à la campagne de démonstration du serveur.
