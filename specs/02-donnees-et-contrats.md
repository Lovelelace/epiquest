# 02 — Données et contrats

## Types partagés

- **DATA-01** — Toute donnée qui traverse une frontière (serveur ↔ web, serveur ↔ mobile, package ↔ package) DOIT être décrite une seule fois, dans le package de schémas partagé.
- **DATA-02** — Les schémas sont écrits avec une bibliothèque de validation (zod). Les types TypeScript en sont **déduits** (`z.infer`), jamais réécrits à la main.
- **DATA-03** — Une modification d'un schéma partagé DOIT faire l'objet d'une PR dédiée, sans code de feature, relue par l'autre membre.
- **DATA-04** — Un changement qui casse la compatibilité (champ supprimé, renommé ou dont le type change) DOIT être signalé dans le titre de la PR par `!` (`feat(schemas)!: ...`) et adapter tous les usages dans la même PR.

## Validation

- **DATA-05** — Toute entrée externe DOIT être validée par son schéma à son arrivée sur le serveur : corps de requête, paramètres, messages WebSocket, fichiers importés, réponses d'API tierces.
- **DATA-06** — Une donnée invalide est rejetée avec une erreur explicite. Elle NE DOIT PAS être corrigée en silence.
- **DATA-07** — Le code situé après la validation PEUT faire confiance aux types. On NE DOIT PAS revalider dans chaque fonction.

## Base de données

- **DATA-08** — Le schéma de base n'évolue que par des **migrations versionnées**, générées par l'ORM et commitées. On NE DOIT JAMAIS modifier la base à la main.
- **DATA-09** — Une PR contient au plus une migration. Avant le merge, on se remet à jour sur `main` et on **régénère** sa migration au lieu de fusionner un conflit à la main.
- **DATA-10** — Une migration mergée sur `main` NE DOIT PLUS être modifiée. On corrige par une nouvelle migration.
- **DATA-11** — Chaque table appartient au domaine d'une feature. Le code d'une autre feature n'y accède que par l'interface de ce domaine (voir `ARCH-14`).
- **DATA-12** — Les identifiants exposés aux clients DEVRAIENT être des UUID, pas des entiers séquentiels.
- **DATA-13** — Les dates sont stockées en UTC et échangées au format ISO 8601.

## Données importées et données de démonstration

- **DATA-14** — Tout import de données et tout seed DOIT être **idempotent** : le relancer ne crée pas de doublon et ne casse rien.
- **DATA-15** — Tout import de données externes DOIT être reproductible : source figée à une version précise, version importée enregistrée en base.
- **DATA-16** — Une fois les données importées, le produit NE DOIT PLUS dépendre de la source externe pour fonctionner.
- **DATA-17** — Les données de démonstration sont versionnées dans le dépôt et chargées par le seed. On NE DOIT PAS les saisir à la main dans l'interface.

## Règles comme données

- **DATA-18** — Un comportement de jeu qui varie selon le contenu (sort, capacité, monstre, objet) DOIT être décrit en **données structurées** interprétées par le code, et non codé au cas par cas.
- **DATA-19** — Tout nouveau format de données interprété par le moteur DOIT avoir un schéma, une documentation et au moins un exemple testé.
