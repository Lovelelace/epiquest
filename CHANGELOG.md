# Changelog

Toutes les évolutions notables sont consignées ici. Le format suit
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet respecte le
[versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Montée de niveau du niveau 2 au niveau 5 (`GET` et `POST /characters/:id/level-up`) : PV à la moyenne ou tirés par le serveur, sous-classe, augmentation de caractéristique (+2 ou +1/+1), expertise, nouveaux sorts mineurs et sorts ; choix validés par le moteur au nouveau niveau, montée historisée. Formulaire sur la fiche.
- Vie du personnage : dégâts, soins et PV temporaires, repos court (dés de vie tirés par le serveur) et long, inventaire avec poids porté et encombrement recalculés, argent avec rendu de monnaie, notes ; chaque modification est enregistrée et historisée (`POST /characters/:id/actions`, `GET /characters/:id/history`).
- Fiche de personnage interactive (`/personnages/[id]`) : un clic ou Entrée sur une compétence, une sauvegarde, une caractéristique, l'initiative ou une attaque lance le jet côté serveur (`POST /characters/:id/rolls`) ; visibilité publique, privée ou cachée ; résultat annoncé aux lecteurs d'écran.
- Assistant de création : étapes compétences (et expertise), équipement de départ, sorts, récapitulatif avec les statistiques du moteur ; création refusée par le serveur si une règle n'est pas respectée. Documentation utilisateur : `docs/utilisateur/creer-un-personnage.md`.
- Assistant de création : étape des caractéristiques (achat de points avec budget restant, tableau standard, 4d6 tiré par le serveur), bonus d'espèce affichés ; options de création résolues depuis le SRD (`GET /character-drafts/:id/options`).
- Assistant de création de personnage (web) : choix de l'espèce et de la sous-espèce, de la classe et de l'historique avec leur détail ; brouillon sauvegardé côté serveur (`/character-drafts`).
- Contrats partagés du personnage (`@epiquest/schemas`) : brouillon de création, options de création, fiche, jets, actions de vie du personnage et montée de niveau.
- Moteur de personnage (`@epiquest/rules`) : calcul des statistiques dérivées (caractéristiques, maîtrise, sauvegardes, compétences, CA, PV, emplacements de sorts, vitesse, encombrement).
- API de consultation du SRD (`GET /srd/<entité>`, `GET /srd/<entité>/<slug>`, `GET /srd/version`) : pagination, recherche plein texte et filtres par entité.
- Import du SRD 5.1 (`pnpm --filter @epiquest/db srd:import`) : source figée dans le dépôt, validée, rejouable sans doublon, version importée enregistrée en base. Lancé automatiquement par Docker Compose.
- Base de données : tables des entités du SRD 5.1 (espèces, classes, sous-classes, historiques, sorts, objets, monstres, états) avec recherche plein texte.
- Squelettes des applications : `apps/server` (NestJS, Socket.IO, `GET /health`), `apps/web` (Next.js App Router, Tailwind), `apps/mobile` (Expo Router, Android), `apps/db` (Drizzle, migration initiale, script de migration).
- Paquet `@epiquest/schemas` : contrats zod partagés.
- Docker Compose : service `migrate` (migrations automatiques), API et web exposés en mode watch sur les ports 3000 et 3001.
- ADR 0002 : stack des applications et rangement du code par feature.
- Monorepo pnpm + Turborepo, TypeScript strict, ESLint, Prettier.
- Hooks Git : lint-staged et commitlint (Conventional Commits).
- Pipelines CI (PR vers `develop` et `main`) et CD (push sur `main`).
- Paquet `@epiquest/rules` : modificateur de caractéristique et bonus de maîtrise, avec tests.
- Docker : `Dockerfile` multi-étapes (dev, build) et `compose.yaml` (PostgreSQL 16 + conteneur de dev), build de l'image vérifié en CI.
- Mode watch : `docker compose watch` (sources synchronisées, rebuild et tests relancés à chaque modification) et `pnpm dev` en local.
- Fichiers de projet : README, CONTRIBUTING, code de conduite, licence, mentions SRD, modèles.
