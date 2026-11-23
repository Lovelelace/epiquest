# Contribuer

Merci de contribuer. Ce guide décrit le déroulé d'une contribution, de l'issue au merge.

## Déroulé

1. **Une issue par tâche.** Toute tâche a une issue dans GitHub Projects, avec un responsable,
   un label, une priorité et un milestone. Pas d'issue, pas de code.
2. **Une branche par issue**, créée depuis `develop` :
   `git switch develop && git pull && git switch -c feat/42-analyseur-des`
3. **Des commits au format [Conventional Commits](https://www.conventionalcommits.org/fr/)**,
   vérifiés par un hook local et par la CI.
4. **Une pull request vers `develop`**, reliée à l'issue (`Closes #42`), avec le modèle rempli.
5. **Une relecture** par au moins un autre membre et une CI verte avant le merge.
6. **Squash merge**, puis suppression de la branche.

La stratégie complète (branches, releases, déploiement) est décrite dans
[docs/branches-et-ci-cd.md](docs/branches-et-ci-cd.md).

## Nommage des branches

`<type>/<numéro-issue>-<description-courte>`, par exemple `feat/42-analyseur-des`,
`fix/57-brouillard-porte`, `docs/12-guide-mj`.

## Messages de commit

```text
<type>(<portée optionnelle>): <description à l'impératif, en anglais>
```

Types acceptés : `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`,
`style`, `revert`. Exemples :

```text
feat(rules): add proficiency bonus by level
fix(sync): never send hidden tokens to player view
docs: add dice notation cheat sheet
```

## Avant d'ouvrir une PR

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Le hook `pre-commit` formate et corrige automatiquement les fichiers modifiés.

## Définition de « terminé »

- Le code est testé (unitaire ou fonctionnel) et la CI est verte.
- La documentation utilisateur ou technique concernée est à jour.
- L'interface est utilisable au clavier et au lecteur d'écran, avec des contrastes conformes.
- Aucun secret, aucun contenu sous licence non libre.
- Tout membre du groupe peut expliquer le code.

## Usage de l'IA

L'IA est autorisée. Le code généré suit les mêmes règles que le reste (tests, revue, sécurité).
Indiquez dans la PR quand une partie notable a été produite avec une IA.
