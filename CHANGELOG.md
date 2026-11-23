# Changelog

Toutes les évolutions notables sont consignées ici. Le format suit
[Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet respecte le
[versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Monorepo pnpm + Turborepo, TypeScript strict, ESLint, Prettier.
- Hooks Git : lint-staged et commitlint (Conventional Commits).
- Pipelines CI (PR vers `develop` et `main`) et CD (push sur `main`).
- Paquet `@epiquest/rules` : modificateur de caractéristique et bonus de maîtrise, avec tests.
- Docker : `Dockerfile` multi-étapes (dev, build) et `compose.yaml` (PostgreSQL 16 + conteneur de dev), build de l'image vérifié en CI.
- Mode watch : `docker compose watch` (sources synchronisées, rebuild et tests relancés à chaque modification) et `pnpm dev` en local.
- Fichiers de projet : README, CONTRIBUTING, code de conduite, licence, mentions SRD, modèles.
