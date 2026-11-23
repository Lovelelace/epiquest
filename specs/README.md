# Specs — règles générales de développement

Ce dossier contient les règles que **tout développement** doit respecter, quelle que soit la feature, et qui que soit l'auteur : membre du groupe, nouveau contributeur ou assistant IA. Les spécifications propres à chaque feature sont rédigées à part.

`CONTRIBUTING.md` décrit le déroulé pratique d'une contribution. Ce dossier en fixe les règles.

## Comment lire ces règles

- **DOIT / NE DOIT PAS** : règle obligatoire. Une PR qui ne la respecte pas n'est pas mergée.
- **DEVRAIT** : règle par défaut. On peut s'en écarter en le justifiant dans la description de la PR.
- Chaque règle porte un identifiant (`ARCH-03`, `SEC-01`…) à citer en revue de code.

## Sommaire

| Fichier                                                | Contenu                                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| [01-architecture.md](01-architecture.md)               | Organisation du code, frontières entre modules, sens des dépendances       |
| [02-donnees-et-contrats.md](02-donnees-et-contrats.md) | Types partagés, validation, base de données, migrations                    |
| [03-workflow-git.md](03-workflow-git.md)               | Issues, branches, commits, pull requests, revue, définition de « terminé » |
| [04-code.md](04-code.md)                               | Conventions TypeScript, nommage, erreurs, logs, dépendances                |
| [05-tests.md](05-tests.md)                             | Ce qu'on teste, comment, et quand                                          |
| [06-securite.md](06-securite.md)                       | Serveur qui fait autorité, permissions, données cachées, secrets           |
| [07-accessibilite.md](07-accessibilite.md)             | Règles WCAG 2.2 AA pour le web et le mobile                                |
| [08-documentation.md](08-documentation.md)             | Documentation utilisateur et technique, ADR                                |

## Modifier une règle

Une règle se change par une PR dédiée, qui ne touche que `specs/` et qui est approuvée par les deux membres du groupe. Si le changement est structurant, il s'accompagne d'un ADR (voir `08-documentation.md`).
