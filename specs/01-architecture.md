# 01 — Architecture

## Organisation du dépôt

- **ARCH-01** — Le dépôt DOIT rester un monorepo organisé en deux familles :
  - `apps/` : ce qui se lance (serveur, web, mobile). Une app assemble des packages et gère les entrées/sorties.
  - `packages/` : la logique réutilisable, partagée entre plusieurs apps.
- **ARCH-02** — Un nouveau dossier à la racine de `apps/` ou `packages/` NE DOIT PAS être créé sans issue validée par les deux membres.
- **ARCH-03** — Chaque package DOIT avoir un `README.md` court : rôle, API publique, comment lancer ses tests.

## Sens des dépendances

- **ARCH-04** — Les dépendances vont toujours dans le même sens : `apps/*` → `packages/*`. Un package NE DOIT JAMAIS importer une app.
- **ARCH-05** — Les dépendances circulaires entre packages sont interdites.
- **ARCH-06** — Une app NE DOIT PAS importer le code d'une autre app. Ce qui doit être partagé descend dans un package.
- **ARCH-07** — Un package n'expose que ce qui est exporté par son point d'entrée (`index.ts`). On NE DOIT PAS importer un fichier interne d'un autre package (`@epiquest/x/src/...`).

## Logique pure, effets en bordure

- **ARCH-08** — La logique métier (calculs, règles, validations) DOIT être écrite en **fonctions pures** : mêmes entrées, même sortie, sans réseau, base de données, horloge, aléatoire ni état global.
- **ARCH-09** — Les packages de logique métier NE DOIVENT PAS importer d'API spécifique à une plateforme (Node, navigateur, React Native) ni d'accès aux données (ORM, fetch). Une règle ESLint `no-restricted-imports` le vérifie.
- **ARCH-10** — Ce qui n'est pas pur (aléatoire, date, accès aux données) DOIT être **injecté en paramètre** (par exemple une fonction `random`), pour pouvoir être remplacé dans les tests.
- **ARCH-11** — Les entrées/sorties (HTTP, WebSocket, base, fichiers) vivent dans les apps, en couches fines : elles valident, appellent la logique, enregistrent, répondent.

## Serveur qui fait autorité

- **ARCH-12** — Toute décision qui affecte la partie (résultat d'un jet, application d'une action, changement d'état) DOIT être prise par le serveur. Le client propose, le serveur décide.
- **ARCH-13** — Le client PEUT calculer à l'avance pour l'affichage (aperçu, probabilités), mais le résultat qui fait foi est toujours celui renvoyé par le serveur.

## Couplage entre features

- **ARCH-14** — Deux features communiquent par une **interface explicite** (fonction exportée, type partagé, événement), jamais en lisant les tables ou l'état interne de l'autre.
- **ARCH-15** — Chaque dossier a un responsable déclaré dans `.github/CODEOWNERS`.
- **ARCH-16** — Une feature qui dépend d'un module pas encore prêt DEVRAIT avancer avec une fausse implémentation de son interface, plutôt que d'attendre.

## Décisions structurantes

- **ARCH-17** — Toute décision difficile à défaire (nouvelle dépendance majeure, nouveau service, changement de stack, format de données partagé) DOIT faire l'objet d'un ADR avant d'être implémentée.
