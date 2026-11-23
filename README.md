# EpiQuest (nom provisoire)

[![CI](https://github.com/lovelelace/epiquest/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/lovelelace/epiquest/actions/workflows/ci.yml)
[![CD](https://github.com/lovelelace/epiquest/actions/workflows/cd.yml/badge.svg?branch=main)](https://github.com/lovelelace/epiquest/actions/workflows/cd.yml)

Table de jeu de rôle virtuelle **compatible 5e édition** : création de personnages, dés, cartes
avec brouillard de guerre et ligne de vue, combat assisté, et deux vues synchronisées (MJ et
joueurs). Web et application mobile.

> « EpiQuest » est le nom du sujet. Le nom et la charte du produit sont à définir (jalon M0).

## Sommaire

- [État du projet](#état-du-projet)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancer les tests](#lancer-les-tests)
- [Structure du dépôt](#structure-du-dépôt)
- [Documentation](#documentation)
- [Contribuer](#contribuer)
- [Usage de l'IA](#usage-de-lia)
- [Licences et attribution](#licences-et-attribution)

## État du projet

Jalon **M0 Fondations** en cours : monorepo, CI/CD, conventions et squelettes des applications.
Les features arrivent aux jalons suivants (voir le tableau GitHub Projects).

| Élément                | État                                                      |
| ---------------------- | --------------------------------------------------------- |
| Moteur de règles       | Premiers calculs (modificateurs, maîtrise)                |
| Serveur (NestJS)       | Squelette : `GET /health`, Socket.IO, connexion à la base |
| Base (Drizzle)         | Squelette : migration initiale vide, migrations auto      |
| Web (Next.js)          | Squelette : page d'accueil                                |
| Application mobile     | Squelette Expo Router (Android) : écran d'accueil         |
| Environnement en ligne | URL fournie ici après le premier déploiement              |

## Prérequis

- [Node.js](https://nodejs.org/) 22 (version dans `.nvmrc`)
- [pnpm](https://pnpm.io/) 10, activé par Corepack : `corepack enable`
- Git

Ou, à la place de Node et pnpm : [Docker](https://docs.docker.com/get-docker/) avec Docker Compose v2.

## Installation

```bash
git clone https://github.com/lovelelace/epiquest.git
cd epiquest
corepack enable
pnpm install
cp .env.example .env
```

### Avec Docker

Sans rien installer d'autre que Docker :

```bash
git clone https://github.com/lovelelace/epiquest.git
cd epiquest
docker compose run --rm dev          # installe les dépendances et lance tous les tests
docker compose up -d db              # démarre la base PostgreSQL de développement (port 5432)
docker compose run --rm dev sh       # shell avec Node 22 et pnpm, sources montées
```

### Développer en mode watch

```bash
docker compose watch                 # base, migrations, API et web avec rechargement automatique
```

| Service    | Adresse               |
| ---------- | --------------------- |
| API NestJS | http://localhost:3000 |
| Web        | http://localhost:3001 |
| PostgreSQL | localhost:5432        |

Les migrations s'appliquent automatiquement au démarrage (service `migrate`), puis à chaque
nouvelle migration. Compose copie dans le conteneur chaque fichier modifié dans `packages/` et
`apps/` : l'API, le web, le build et les tests se relancent automatiquement. Une modification de `turbo.json` ou de
`tsconfig.base.json` redémarre le conteneur. Une modification des dépendances (`package.json`
racine, `pnpm-lock.yaml`, `pnpm-workspace.yaml`) reconstruit l'image. `Ctrl+C` arrête le watch.
Docker Compose 2.22 ou plus récent est requis.

Sans Docker : démarrer la base (`docker compose up -d db` ou un PostgreSQL local), appliquer les
migrations avec `pnpm --filter @epiquest/db migrate`, puis lancer `pnpm dev`. Le serveur et les
scripts de la base lisent le fichier `.env` de la racine.

L'application mobile se lance à part, hors Docker : voir
[apps/mobile/README.md](apps/mobile/README.md).

Les identifiants de la base de développement sont ceux de `.env.example`. Ils ne servent qu'en
local.

## Lancer les tests

Tous les tests du dépôt, en une seule commande :

```bash
pnpm test
```

Autres commandes utiles :

| Commande         | Rôle                                                          |
| ---------------- | ------------------------------------------------------------- |
| `pnpm lint`      | ESLint et vérification Prettier                               |
| `pnpm format`    | Formate tout le code avec Prettier                            |
| `pnpm typecheck` | Vérification des types TypeScript                             |
| `pnpm build`     | Build de tous les paquets                                     |
| `pnpm dev`       | API, web, build incrémental et tests en continu (hors mobile) |

Lancer les tests d'un seul paquet : `pnpm --filter @epiquest/rules test`.
Lancer un seul fichier de test : `pnpm --filter @epiquest/rules exec vitest run src/abilities.test.ts`.

Dans chaque app, le code est rangé par feature : `src/features/<feature>/`, plus `src/shared/`
pour ce qui est transverse. Chaque dossier `features/` a un README qui décrit la convention.

## Structure du dépôt

```text
apps/server/       API NestJS + Socket.IO (le serveur fait autorité)
apps/web/          Client web Next.js (App Router, Tailwind) : vues MJ et joueurs
apps/mobile/       Application Android Expo (Expo Router)
apps/db/           Base de données : schéma Drizzle, migrations, seed, import du SRD
packages/rules/    Moteur de règles partagé (TypeScript pur)
packages/schemas/  Contrats zod partagés entre serveur, web et mobile
specs/             Règles générales de développement
docs/              Documentation utilisateur et technique, décisions (ADR)
.github/           CI/CD, modèles d'issue et de pull request
```

## Documentation

- [Stratégie de branches et CI/CD](docs/branches-et-ci-cd.md)
- [Décisions d'architecture (ADR)](docs/adr/)
- Documentation utilisateur : à venir

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md) : branches, conventions de commit, revue de code.
Le projet suit un [code de conduite](CODE_OF_CONDUCT.md).

## Usage de l'IA

Le groupe utilise des outils d'IA et le déclare ici, conformément au sujet. Chaque contenu
généré est relu, testé et doit pouvoir être expliqué par chaque membre.

| Outil  | Usage                                                                              |
| ------ | ---------------------------------------------------------------------------------- |
| Claude | Plan de projet initial, squelette du dépôt (configuration, CI/CD, README, modèles) |

Les PR indiquent dans leur description si une partie notable a été produite avec une IA.

## Licences et attribution

Le code est distribué sous licence [MIT](LICENSE).

Ce produit utilise du contenu du System Reference Document 5.1 sous licence CC BY 4.0. Voir
[NOTICE.md](NOTICE.md) pour la mention d'attribution complète. Il n'est ni affilié ni approuvé
par Wizards of the Coast.
