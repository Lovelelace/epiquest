# Délai de synchronisation MJ → joueurs

Mesure reproductible demandée par CODE-25 (issue #56). Elle répond à une question : combien de
temps s'écoule entre une action du MJ et sa réception par tous les joueurs connectés ?

## Lancer la mesure

```sh
pnpm install
pnpm --filter @epiquest/schemas build
pnpm --filter @epiquest/server measure:sync
# Variante : SYNC_PLAYERS=20 SYNC_ITERATIONS=1000 pnpm --filter @epiquest/server measure:sync
```

| Variable          | Rôle                                             | Défaut |
| ----------------- | ------------------------------------------------ | ------ |
| `SYNC_PLAYERS`    | Nombre de connexions dans la salle des joueurs   | 6      |
| `SYNC_ITERATIONS` | Nombre de déplacements mesurés                   | 500    |
| `SYNC_WARMUP`     | Déplacements d'échauffement, exclus des chiffres | 50     |

La mesure ne fait pas partie de `pnpm test` : un seuil de temps en CI dépendrait de la charge
de la machine et rendrait les tests instables (TEST-05).

## Méthode

Code : `apps/server/src/features/table/sync-latency.measure.ts`.

1. Un vrai serveur NestJS + Socket.IO démarre sur un port libre (transport WebSocket), avec la
   table de démonstration.
2. Un MJ rejoint la salle `gm`, puis `SYNC_PLAYERS` joueurs la salle `players`.
3. À chaque itération, le MJ déplace un jeton visible (`table:move-token`). Le chronomètre part
   juste avant l'envoi et s'arrête quand chaque joueur a reçu la vue de la révision attendue.
   On relève le délai du dernier joueur (« tous les joueurs ont reçu »), celui du premier, et
   celui de l'accusé de réception du MJ.
4. À part, le coût de `projectForPlayers` est mesuré sur 2 000 appels, sur la table de
   démonstration et sur une grande table (grille 100 × 100 révélée à moitié, 200 jetons,
   50 jets).

Le délai mesuré couvre la validation du message, l'action, la projection (deux par action : la
vue avant et après, pour ne rien envoyer aux joueurs quand rien de visible n'a changé), la
sérialisation, l'envoi WebSocket et le décodage côté client. Le serveur et les clients tournent
dans le même processus Node sur la même machine : **le délai réseau réel ne fait pas partie de
la mesure** et s'ajoute en production (aller simple client → serveur → client).

## Résultats

Mesure du 24 novembre 2026, branche `feat/56-mesure-synchronisation`.
Machine : Intel Xeon @ 2,10 GHz (4 cœurs), Linux 6.18, Node 22.23.

| Scénario                               | Médiane | p95     | Maximum |
| -------------------------------------- | ------- | ------- | ------- |
| 6 joueurs : tous ont reçu              | 0,64 ms | 0,94 ms | 3,45 ms |
| 6 joueurs : premier joueur             | 0,52 ms | 0,80 ms | 3,35 ms |
| 6 joueurs : accusé de réception du MJ  | 0,48 ms | 0,75 ms | 3,30 ms |
| 20 joueurs : tous ont reçu             | 0,85 ms | 1,82 ms | 4,79 ms |
| 20 joueurs : accusé de réception du MJ | 0,54 ms | 1,11 ms | 2,37 ms |

| Coût de `projectForPlayers`          | Médiane | p95      |
| ------------------------------------ | ------- | -------- |
| Table de démonstration (12 × 9)      | 3,3 µs  | 5,2 µs   |
| Grande table (100 × 100, 200 jetons) | 645 µs  | 1 250 µs |

## Lecture

- Le serveur ajoute moins de 2 ms au p95, même à 20 joueurs : le délai perçu sera celui du
  réseau. L'objectif d'usage (une action du MJ visible « immédiatement » à la table, sous
  100 ms) est tenu tant que la latence réseau reste sous ~90 ms.
- Une seule projection est calculée par action et partagée par toute la salle des joueurs : le
  coût ne dépend pas du nombre de joueurs.
- Sur une très grande carte, la projection dépasse la milliseconde au p95 et l'état complet est
  renvoyé à chaque action. Si l'éditeur de cartes (feature 5) produit de telles cartes, deux
  pistes, à mesurer avant de les coder (CODE-26) : envoyer des différences plutôt que l'état
  complet, et garder en mémoire la dernière vue projetée au lieu de la recalculer.
