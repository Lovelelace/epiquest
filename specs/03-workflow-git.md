# 03 — Workflow Git et GitHub

## Issues

- **GIT-01** — Tout travail commence par une issue sur le tableau GitHub Projects, avec un responsable, un label, un statut et un milestone.
- **GIT-02** — Une issue DOIT tenir en **0,5 à 2 jours** de travail. Au-delà, on la découpe.
- **GIT-03** — Une issue DOIT contenir des **critères d'acceptation** vérifiables (« c'est terminé quand… »).
- **GIT-04** — Le statut de l'issue sur le tableau est tenu à jour par son responsable : *À faire → En cours → En revue → Terminé*.

## Branches

- **GIT-05** — `main` est protégée et toujours déployable. Personne n'y pousse directement, pas même pour une correction rapide.
- **GIT-06** — Une branche par issue, nommée `type/numéro-description-courte` : `feat/12-parseur-des`, `fix/34-calcul-ca`, `docs/8-readme`.
- **GIT-07** — Une branche DEVRAIT vivre moins de 3 jours. On se remet à jour sur `main` (rebase) au moins une fois par jour.

## Commits

- **GIT-08** — Les messages de commit suivent **Conventional Commits** : `type(portée): description`, à l'impératif et en minuscules.
  - Types autorisés : `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`, `style`.
  - La portée est le nom du package ou de l'app : `feat(dice): ...`, `fix(web): ...`.
- **GIT-09** — Un commit DEVRAIT contenir un seul changement logique.
- **GIT-10** — On NE DOIT JAMAIS committer de secret, de fichier `.env`, de dépendance installée, de build ou de fichier d'éditeur. Un secret commité par erreur est **révoqué immédiatement**, puis retiré de l'historique.

## Pull requests

- **GIT-11** — Toute modification passe par une pull request reliée à son issue (`Closes #12` dans la description).
- **GIT-12** — Une PR DEVRAIT rester petite : moins de 400 lignes modifiées hors fichiers générés. Une PR plus grosse doit être justifiée.
- **GIT-13** — Une PR NE DOIT PAS mélanger plusieurs sujets (feature + refactoring + mise à jour de dépendances).
- **GIT-14** — Le modèle de PR est rempli en entier : ce qui change, comment tester, captures d'écran pour tout changement visible.
- **GIT-15** — Une PR est mergée en **squash**, avec un titre au format Conventional Commits.

## Revue de code

- **GIT-16** — Une PR DOIT être approuvée par l'autre membre et avoir une CI verte avant le merge.
- **GIT-17** — Une PR DEVRAIT être relue dans la journée où elle est ouverte.
- **GIT-18** — Le relecteur vérifie au minimum : respect des specs, tests présents et pertinents, accessibilité, absence de données cachées envoyées au client, documentation à jour.
- **GIT-19** — Les commentaires de revue portent sur le code, jamais sur la personne. Un désaccord qui dure plus d'un échange se règle de vive voix.
- **GIT-20** — Chaque membre DOIT être capable d'expliquer tout code qu'il approuve.

## Définition de « terminé »

Une issue est terminée quand **toutes** ces conditions sont réunies :

- [ ] Les critères d'acceptation de l'issue sont remplis.
- [ ] Les tests sont écrits et passent (voir `05-tests.md`).
- [ ] Le lint, le typage et le build passent en CI.
- [ ] L'accessibilité a été vérifiée au clavier, et au lecteur d'écran pour un nouvel écran (voir `07-accessibilite.md`).
- [ ] La documentation utilisateur et/ou technique est à jour.
- [ ] Le `CHANGELOG.md` est mis à jour si le changement est visible par un utilisateur.
- [ ] La PR est relue, approuvée et mergée.
- [ ] Le changement fonctionne sur l'environnement en ligne après le déploiement.

## Versions

- **GIT-21** — Les versions suivent le versionnage sémantique et sont taguées sur `main` (`v0.1.0`) à chaque étape clé.
