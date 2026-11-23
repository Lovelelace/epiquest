# Changelog

Toutes les évolutions notables sont consignées ici. Le format suit
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet respecte le
[versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Import du SRD 5.1 (`pnpm --filter @epiquest/db srd:import`) : source figée dans le dépôt, validée, rejouable sans doublon, version importée enregistrée en base. Lancé automatiquement par Docker Compose.
- Base de données : tables des entités du SRD 5.1 (espèces, classes, sous-classes, historiques, sorts, objets, monstres, états) avec recherche plein texte.
- Format des effets de jeu (attaque, sauvegarde, dégâts, soins, état, modificateur) en schémas zod dans `@epiquest/schemas`, ADR 0003.
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
