# Branches et CI/CD

## Branches

| Branche                      | Rôle                                    | Protection                            | Déploiement                |
| ---------------------------- | --------------------------------------- | ------------------------------------- | -------------------------- |
| `main`                       | Production : ce qui est en ligne        | PR obligatoire, 1 relecture, CI verte | Automatique à chaque merge |
| `develop`                    | Intégration des fonctionnalités         | PR obligatoire, 1 relecture, CI verte | Aucun                      |
| `feat/*`, `fix/*`, `docs/*`… | Une branche par issue, depuis `develop` | Aucune                                | Aucun                      |

Aucun push direct n'est autorisé sur `main` ni sur `develop`.

## Cycle de vie

```text
feat/42-analyseur-des ──PR──▶ develop ──PR de release──▶ main ──▶ déploiement
```

1. Les fonctionnalités sont mergées dans `develop` (squash merge).
2. À la fin de chaque jalon, ou dès qu'une version stable est prête, une PR `develop → main`
   est ouverte (merge commit, pour garder l'historique des fonctionnalités).
3. Le merge dans `main` déclenche le déploiement, puis un tag SemVer est posé : `v0.1.0` (M0),
   `v0.2.0` (M1), … `v1.0.0` (soutenance).
4. Un correctif urgent part de `main` (`hotfix/…`), est mergé dans `main`, puis reporté dans
   `develop`.

## Pipelines

| Workflow                    | Déclencheur                                      | Étapes                                                                                                                                                           |
| --------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                    | Toute PR (y compris empilée), push sur `develop` | Installation verrouillée, lint, types, tests, build ; vérification des messages de commit ; scan de secrets (gitleaks) ; build de l'image Docker (cible `build`) |
| `cd.yml`                    | Push sur `main`, ou lancement manuel             | Mêmes vérifications, puis déploiement via le secret `DEPLOY_HOOK_URL` (environnement GitHub `production`)                                                        |
| `dependabot-auto-merge.yml` | PR ouverte par Dependabot                        | Approuve et active l'auto-merge (squash) des mises à jour mineures et correctives ; les majeures restent à relire                                                |

Les secrets du pipeline sont stockés dans **Settings → Secrets and variables → Actions**, jamais
dans le code. Tant que l'hébergeur n'est pas choisi, l'étape de déploiement affiche un
avertissement et ne fait rien.

À venir : build de l'APK Android en artefact (M1), tests end-to-end et audit d'accessibilité
automatisé (axe) dans la CI, publication de la documentation sur GitHub Pages.

## Mises à jour de dépendances (Dependabot)

Dependabot vérifie les dépendances npm et les actions GitHub chaque lundi à 6 h et ouvre au
plus une PR groupée par catégorie vers `develop` :

- npm, mises à jour mineures et correctives : approuvées par le bot `github-actions`, puis
  fusionnées automatiquement dès que toutes les vérifications obligatoires sont vertes ;
- npm, mises à jour majeures : une PR à relire et merger à la main (risque de rupture) ;
- actions GitHub : une PR groupée, fusionnée automatiquement si elle ne contient que du mineur
  ou du correctif, sinon à relire.

Cela demande deux réglages du dépôt : **Settings → General → Allow auto-merge** et
**Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**.

## Vérifications obligatoires

Dans **Settings → Branches**, les règles de `main` et `develop` exigent les vérifications
`Lint, types, tests, build`, `Image Docker`, `Conventional Commits` et `Scan de secrets`. Une PR dont le
pipeline échoue ne peut pas être mergée.
