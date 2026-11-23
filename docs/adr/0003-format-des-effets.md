# 0003 — Format des effets de jeu

- Statut : Proposée
- Date : 2026-11-23

## Contexte

Le moteur de règles doit appliquer les sorts, capacités et attaques de monstres sans code au cas
par cas (règle DATA-18). Il faut donc décrire ce qu'ils font en données structurées, lues par le
moteur (`packages/rules`), le serveur et les clients, et validées à leur arrivée (DATA-05).

Le SRD ne fournit que du texte, plus quelques champs partiels (dégâts des sorts, DD). Les
données structurées viennent de deux sources : des annotations écrites à la main pour la démo
(#15) et une conversion automatique des attaques de monstres (#16).

## Options envisagées

1. **Liste d'effets typés** (union discriminée sur `type`), avec deux niveaux : une résolution
   (attaque, jet de sauvegarde) et ses conséquences (dégâts, soins, état, modificateur).
2. **Arbre d'effets récursif** : n'importe quel effet peut en contenir d'autres (attaque dans une
   sauvegarde, conditions, boucles).
3. **Petit langage de script** interprété par le moteur.
4. **Reprendre les champs de la source** (`damage`, `dc`, `area_of_effect` de 5e-database).

## Décision

Option 1, décrite en zod dans `@epiquest/schemas` (`src/effects.ts`) :

- `ActionEffects` : ce qui se passe quand on utilise l'élément. Activation (`action`,
  `bonus_action`, `reaction`), portée en pieds ou `self`/`touch`, zone facultative,
  concentration, et une liste ordonnée d'effets.
- Effets de résolution : `attack` (type d'attaque, bonus fixe ou celui de l'auteur, allonge ou
  portée, `onHit`, `onMiss`) et `saving_throw` (caractéristique, DD fixe ou celui de l'auteur,
  `onFail`, `onSuccess`, `halfDamageOnSuccess`).
- Conséquences : `damage` (dés, type de dégâts, dés par niveau d'emplacement), `healing`,
  `apply_condition` (état du SRD, durée, sauvegarde répétée) et `modifier` (cible, valeur fixe ou
  en dés, durée).
- Les dés sont écrits dans la notation du moteur de dés (`2d6 + 3`), en chaîne : le moteur les
  analyse au moment du jet. En attendant l'analyseur (#18), une expression régulière valide le
  sous-ensemble utilisé par le SRD (`NdX`, constantes, `+` et `-`).
- Un bonus ou un DD absent signifie « celui de l'auteur » : la même annotation sert pour tous les
  personnages, quel que soit leur niveau.

L'option 2 rend la validation, le calcul et l'affichage plus difficiles pour un gain faible : la
grande majorité des sorts et attaques du SRD tiennent en une résolution suivie de conséquences.
L'option 3 demande d'écrire et de sécuriser un interpréteur. L'option 4 est incomplète (pas
d'états, pas d'attaques de monstres) et nous lierait au format d'un projet tiers.

## Conséquences

- Le format est partagé : le serveur valide les annotations à l'import, le moteur les applique, les
  clients les affichent (aperçu des dégâts, DD) sans dupliquer de types.
- Une entrée sans annotation reste utilisable : le MJ applique le texte à la main.
- Limites connues, résolues par le MJ ou par une évolution du format (nouvel ADR) :
  - pas d'effets imbriqués sur plus de deux niveaux, ni de conditions (« si la cible est un
    mort-vivant ») ;
  - pas de dégâts différés (Acid Arrow : la partie « fin du prochain tour » n'est pas décrite) ;
  - pas de progression des sorts mineurs selon le niveau du personnage ;
  - pas de choix laissés au lanceur (type de dégâts au choix, nombre de cibles) ;
  - les modificateurs ne couvrent que la CA, les jets d'attaque, de dégâts, de sauvegarde, de
    caractéristique et la vitesse.
- Ajouter un type d'effet est un changement de schéma partagé : PR dédiée (DATA-03), exemple
  testé (DATA-19), et ce document mis à jour.
