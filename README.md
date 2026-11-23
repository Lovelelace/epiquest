# EpiQuest (nom provisoire)

[![CI](https://github.com/axel-gallard/epiquest/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/axel-gallard/epiquest/actions/workflows/ci.yml)
[![CD](https://github.com/axel-gallard/epiquest/actions/workflows/cd.yml/badge.svg?branch=main)](https://github.com/axel-gallard/epiquest/actions/workflows/cd.yml)

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

Jalon **M0 Fondations** en cours : monorepo, CI/CD et conventions. Le serveur, le web et l'app
mobile arrivent aux jalons suivants (voir le tableau GitHub Projects).

| Élément                | État                                         |
| ---------------------- | -------------------------------------------- |
| Moteur de règles       | Premiers calculs (modificateurs, maîtrise)   |
| Serveur                | À venir (M1)                                 |
| Web                    | À venir (M1)                                 |
| Application mobile     | À venir (M1)                                 |
| Environnement en ligne | URL fournie ici après le premier déploiement |

## Prérequis

- [Node.js](https://nodejs.org/) 22 (version dans `.nvmrc`)
- [pnpm](https://pnpm.io/) 10, activé par Corepack : `corepack enable`
- Git

Docker sera nécessaire à partir du jalon M1 (base PostgreSQL de développement).

## Installation

```bash
git clone https://github.com/axel-gallard/epiquest.git
cd epiquest
corepack enable
pnpm install
cp .env.example .env
```

## Lancer les tests

Tous les tests du dépôt, en une seule commande :

```bash
pnpm test
```

Autres commandes utiles :

| Commande         | Rôle                               |
| ---------------- | ---------------------------------- |
| `pnpm lint`      | ESLint et vérification Prettier    |
| `pnpm format`    | Formate tout le code avec Prettier |
| `pnpm typecheck` | Vérification des types TypeScript  |
| `pnpm build`     | Build de tous les paquets          |

Lancer les tests d'un seul paquet : `pnpm --filter @epiquest/rules test`.
Lancer un seul fichier de test : `pnpm --filter @epiquest/rules exec vitest run src/abilities.test.ts`.

## Structure du dépôt

```text
apps/              Applications (serveur, web, mobile) — à venir
packages/rules/    Moteur de règles partagé (TypeScript pur)
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
