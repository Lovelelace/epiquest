# @epiquest/mobile

Application mobile Android avec [Expo](https://expo.dev) et
[Expo Router](https://docs.expo.dev/router/introduction/) : création de personnage, fiche et
lancer de dés. Elle utilise le même moteur de règles que le web (`@epiquest/rules`).

## Organisation

```text
src/
├── app/               routes Expo Router : uniquement des réexportations d'écrans
├── features/          un dossier par feature (voir features/README.md)
└── shared/
    └── screens/       écrans transverses (accueil…)
```

## Lancer l'application

Prérequis : Node 22, pnpm, et soit un téléphone Android avec
[Expo Go](https://expo.dev/go), soit un émulateur Android (Android Studio).

```bash
pnpm --filter @epiquest/mobile dev        # démarre Metro, puis scanner le QR code avec Expo Go
pnpm --filter @epiquest/mobile android    # ouvre directement l'émulateur Android
```

L'application mobile ne tourne pas dans Docker.

## Commandes

| Commande                                   | Rôle                               |
| ------------------------------------------ | ---------------------------------- |
| `pnpm --filter @epiquest/mobile dev`       | Serveur de développement Metro     |
| `pnpm --filter @epiquest/mobile test`      | Tests (jest-expo, Testing Library) |
| `pnpm --filter @epiquest/mobile typecheck` | Vérification des types             |

## À venir

- Build de l'APK en CI (artefact du pipeline), avec l'identifiant Android de l'application.
- Icône et écran de démarrage, à créer avec la charte graphique.

Les versions des paquets Expo doivent rester compatibles avec le SDK : pour en ajouter un,
utilisez `pnpm --filter @epiquest/mobile exec expo install <paquet>`.
