# 05 — Tests

## Principes

- **TEST-01** — Tout le code de logique métier (packages purs) DOIT être couvert par des tests unitaires.
- **TEST-02** — Toute correction de bug DOIT ajouter un test qui échoue sans la correction.
- **TEST-03** — Tous les tests se lancent en **une seule commande** à la racine (`pnpm test`). Lancer un seul test ou un seul package est documenté dans le README.
- **TEST-04** — Les tests sont déterministes : même résultat à chaque exécution. L'aléatoire et l'horloge sont injectés (voir `ARCH-10`) et fixés dans les tests.
- **TEST-05** — Un test instable (qui échoue parfois) est corrigé ou supprimé le jour même. On ne relance pas la CI « jusqu'à ce que ça passe ».

## Quoi tester, et où

| Niveau       | Quoi                                                            | Où                          |
| ------------ | --------------------------------------------------------------- | --------------------------- |
| Unitaire     | Fonctions pures : calculs, règles, validations, analyseurs      | À côté du code, `*.test.ts` |
| Intégration  | Routes API et événements temps réel avec une vraie base de test | `apps/server/test/`         |
| Composant    | Comportement et accessibilité des composants d'interface        | À côté du composant         |
| Bout en bout | Parcours critiques complets                                     | `e2e/`                      |

- **TEST-06** — Chaque route ou événement serveur DEVRAIT avoir au moins un test d'intégration pour le cas nominal et un pour chaque refus de permission.
- **TEST-07** — Tout filtrage d'informations cachées DOIT avoir des tests qui prouvent que la donnée cachée n'est **pas** présente dans ce qui est envoyé (voir `SEC-08`).
- **TEST-08** — Les composants d'interface sont testés avec un contrôle d'accessibilité automatique (axe).

## Écriture des tests

- **TEST-09** — Un test vérifie un seul comportement, et son nom le décrit comme une phrase : `it("applique la moitié des dégâts si la sauvegarde réussit")`.
- **TEST-10** — On teste le comportement observable, pas l'implémentation interne.
- **TEST-11** — Les cas de référence (valeurs calculées à la main et vérifiées) sont stockés dans des fichiers de données (fixtures), relus par l'autre membre.
- **TEST-12** — Un code aléatoire est testé de deux façons : avec une source d'aléatoire fixée (résultat exact) et par un test statistique de distribution sur un grand nombre de tirages.

## Couverture et CI

- **TEST-13** — La couverture des packages de logique métier DEVRAIT rester au-dessus de 80 %. La couverture est un indicateur, pas un objectif : un test sans vérification utile ne compte pas.
- **TEST-14** — La CI exécute les tests du serveur, du web, des packages et du mobile à chaque PR. Une PR rouge ne se merge pas.
