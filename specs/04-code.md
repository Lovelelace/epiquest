# 04 — Code

## TypeScript

- **CODE-01** — TypeScript est en mode `strict` partout. On NE DOIT PAS désactiver une option de rigueur pour faire passer du code.
- **CODE-02** — `any` est interdit. On utilise `unknown` suivi d'une validation ou d'un rétrécissement de type.
- **CODE-03** — `@ts-ignore` est interdit. `@ts-expect-error` est toléré avec un commentaire qui explique pourquoi.
- **CODE-04** — Les assertions de type (`as X`) DEVRAIENT être évitées. Quand elles sont nécessaires, elles sont commentées.
- **CODE-05** — Les fonctions exportées ont un type de retour explicite.

## Formatage et lint

- **CODE-06** — Le formatage est entièrement géré par Prettier. On ne discute pas de formatage en revue.
- **CODE-07** — Le lint et le formatage tournent automatiquement avant chaque commit et en CI. Désactiver une règle ESLint sur une ligne exige un commentaire qui justifie l'exception.

## Nommage et langue

- **CODE-08** — Le code (variables, fonctions, types, fichiers) est écrit **en anglais**. Les messages visibles par l'utilisateur passent par les fichiers de traduction.
- **CODE-09** — Conventions :
  - `camelCase` pour les variables et fonctions, `PascalCase` pour les types et composants, `SCREAMING_SNAKE_CASE` pour les constantes globales.
  - Fichiers en `kebab-case.ts`, composants React en `PascalCase.tsx`.
  - Booléens préfixés : `isVisible`, `hasConcentration`, `canMove`.
- **CODE-10** — Les noms décrivent l'intention du point de vue du métier (`armorClass`, pas `ac` ni `val2`). Les abréviations du jeu reconnues sont tolérées si elles sont documentées dans le glossaire.

## Structure

- **CODE-11** — Une fonction fait une seule chose. Une fonction de plus de 50 lignes DEVRAIT être découpée.
- **CODE-12** — Pas de code mort : pas de code commenté, pas de fonction inutilisée, pas de fichier orphelin. L'historique Git garde le reste.
- **CODE-13** — Pas de valeur magique : une règle numérique (bonus, seuil, taille) est une constante nommée ou une donnée, jamais un nombre isolé dans le code.
- **CODE-14** — Les `TODO` sont interdits sur `main`, sauf s'ils renvoient à une issue ouverte : `// TODO(#42): ...`.

## Erreurs

- **CODE-15** — On NE DOIT JAMAIS ignorer une erreur en silence (`catch {}` vide).
- **CODE-16** — Les erreurs métier attendues (choix invalide, action interdite) sont des **types d'erreur explicites** avec un code stable, pas des chaînes libres.
- **CODE-17** — Le serveur renvoie des erreurs au format uniforme `{ code, message, details? }`. Un message destiné à l'utilisateur est compréhensible par un non-développeur.
- **CODE-18** — Les erreurs inattendues ne remontent jamais de trace technique au client en production.

## Logs

- **CODE-19** — Les logs du serveur sont structurés (JSON en production, lisibles en développement) et ont un niveau (`debug`, `info`, `warn`, `error`).
- **CODE-20** — On NE DOIT JAMAIS logger de mot de passe, de jeton, de cookie de session ni de donnée personnelle.
- **CODE-21** — Pas de `console.log` dans le code mergé. On utilise le logger.

## Dépendances

- **CODE-22** — Toute nouvelle dépendance est justifiée dans la PR : à quoi elle sert, pourquoi on ne l'écrit pas soi-même, si elle est maintenue, quelle est sa licence.
- **CODE-23** — Le lockfile est commité, et la CI installe avec `--frozen-lockfile`.
- **CODE-24** — Les licences des dépendances DOIVENT être compatibles avec celle du projet.

## Performance

- **CODE-25** — Tout calcul susceptible d'être coûteux (ligne de vue, probabilités, synchronisation) a une mesure de performance reproductible, et le résultat est documenté.
- **CODE-26** — On n'optimise pas sans mesure préalable.
