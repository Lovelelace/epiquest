# Moteur de dés — notation

Cette page décrit la notation des dés acceptée par le produit et la façon dont elle est analysée.
Le code se trouve dans `packages/rules/src/dice/`. Ce sont des fonctions pures, sans aléatoire ni
accès réseau, utilisées par le serveur, le web et le mobile.

État actuel : **analyse de la notation** (parseur). L'évaluation des jets, les modificateurs
(`kh`, `kl`, dés explosifs, relances) et le calcul des probabilités viendront ensuite.

## Notation acceptée

| Exemple         | Signification                                     |
| --------------- | ------------------------------------------------- |
| `2d6`           | 2 dés à 6 faces                                   |
| `d20`           | 1 dé à 20 faces (le nombre de dés vaut 1)         |
| `1d20 + 5`      | 1 dé à 20 faces, plus 5                           |
| `1d8 + 1d6 - 2` | plusieurs groupes de dés dans une même expression |
| `4d6 * 100`     | multiplication                                    |
| `1d6 / 2`       | division                                          |
| `(1d6 + 2) * 2` | parenthèses                                       |
| `-1d4`          | moins unaire                                      |

Tolérance de saisie : les espaces (y compris tabulations et espaces insécables) sont ignorés, et
`D` vaut `d`.

## Grammaire

De la priorité la plus faible à la plus forte :

```text
expression = term { ("+" | "-") term }
term       = signed { ("*" | "/") signed }
signed     = [ "-" ] primary
primary    = dice | number | "(" expression ")"
dice       = [ number ] "d" number
number     = chiffre { chiffre }
```

- `*` et `/` passent avant `+` et `-` : `1 + 2 * 3` vaut `1 + (2 * 3)`.
- Les opérations d'une même priorité se lisent de gauche à droite : `10 - 2 - 3` vaut
  `(10 - 2) - 3`.
- Le moins unaire n'est accepté **qu'en tête d'expression ou juste après `(`**. `1d6--2` et
  `2*-1` sont refusés, pour éviter qu'une faute de frappe change le résultat en silence. Pour une
  valeur négative ailleurs, on écrit `2 * (-1)`.
- Il n'y a pas de plus unaire : `+3` est refusé.

## Limites

Définies dans `packages/rules/src/dice/limits.ts`. Elles protègent le serveur, qui lance les dés
pour toutes les parties, contre des jets démesurés.

| Constante               | Valeur                   | Rôle                                       |
| ----------------------- | ------------------------ | ------------------------------------------ |
| `DIE_SIZES`             | 4, 6, 8, 10, 12, 20, 100 | Dés autorisés : uniquement ceux du jeu     |
| `MAX_DICE_PER_GROUP`    | 100                      | Nombre de dés maximal dans un groupe       |
| `MAX_CONSTANT`          | 1 000                    | Plus grande constante (couvre `4d6 * 100`) |
| `MAX_EXPRESSION_LENGTH` | 200                      | Longueur maximale de la saisie             |

## Fonctionnement

L'analyse se fait en deux étapes :

1. **Tokenizer** (`tokenizer.ts`, interne au paquet) : découpe le texte en tokens (nombre, `d`,
   opérateurs, parenthèses), chacun avec sa position. Il refuse les caractères inconnus.
2. **Parseur** (`parser.ts`) : un parseur à descente récursive écrit à la main, avec une méthode
   par règle de la grammaire. Il construit l'arbre syntaxique (AST) et vérifie les limites.

### Arbre syntaxique

| Nœud     | Champs                                 | Exemple   |
| -------- | -------------------------------------- | --------- |
| `dice`   | `count`, `sides`                       | `2d6`     |
| `number` | `value`                                | `3`       |
| `binary` | `operator` (+ - \* /), `left`, `right` | `1d6 + 3` |
| `negate` | `operand`                              | `-1d4`    |

Chaque nœud porte un `span` : sa position dans le texte saisi, sous la forme
`{ start, end }` (début inclus, fin exclue, à partir de 0). La position d'une sous-expression
entre parenthèses inclut ses parenthèses.

### Fonctions publiques

Exportées par `@epiquest/rules` :

- `parseDiceExpression(texte)` : renvoie l'arbre, ou lève une `DiceSyntaxError`.
- `formatDiceExpression(arbre)` : renvoie la forme canonique de l'expression, celle qui est
  enregistrée et affichée. `2D6+3` devient `2d6 + 3`, `d20` devient `1d20`, et seules les
  parenthèses nécessaires sont gardées. Relire la forme canonique redonne le même arbre.

## Erreurs

Toute erreur de saisie est une `DiceSyntaxError` avec :

- `code` : un code stable, que l'interface utilise pour traduire le message ;
- `message` : un message en français, utilisé par défaut et dans les logs ;
- `span` : la partie du texte en cause (positions à partir de 0), pour la surligner ;
- `details` : les valeurs utiles au message. Les positions qui y figurent commencent à 1, comme
  dans les messages.

| Code                            | Cas                                                | Exemple    | `details`                              |
| ------------------------------- | -------------------------------------------------- | ---------- | -------------------------------------- |
| `EMPTY_EXPRESSION`              | Saisie vide ou faite d'espaces                     | `""`       | —                                      |
| `EXPRESSION_TOO_LONG`           | Plus de 200 caractères                             | —          | `length`, `max`                        |
| `UNEXPECTED_CHARACTER`          | Caractère inconnu                                  | `1d6#`     | `character`, `position`                |
| `UNEXPECTED_TOKEN`              | Élément mal placé (deux valeurs, deux opérateurs…) | `1d6 3`    | `token`, `position`                    |
| `UNEXPECTED_END`                | Expression incomplète                              | `1d6+`     | `after`                                |
| `MISSING_CLOSING_PARENTHESIS`   | Parenthèse ouverte jamais fermée                   | `(1d6`     | `position` (de la parenthèse ouvrante) |
| `UNMATCHED_CLOSING_PARENTHESIS` | Parenthèse fermante en trop                        | `1d6)`     | `position`                             |
| `MISSING_DIE_SIZE`              | `d` sans nombre de faces                           | `3d`       | `position`                             |
| `INVALID_DIE_SIZE`              | Dé qui n'existe pas dans le jeu                    | `2d7`      | `sides`, `allowed`, `position`         |
| `INVALID_DICE_COUNT`            | Zéro dé                                            | `0d6`      | `count`, `position`                    |
| `TOO_MANY_DICE`                 | Plus de 100 dés dans un groupe                     | `101d6`    | `count`, `max`                         |
| `NUMBER_TOO_LARGE`              | Constante supérieure à 1 000                       | `1d6+1001` | `value`, `max`                         |

Exemple de message : pour `2d7`, « Le dé à 7 faces n'existe pas (position 3). Dés autorisés :
d4, d6, d8, d10, d12, d20, d100. »

La division par zéro n'est pas une erreur de syntaxe : elle sera traitée à l'évaluation.

## Tests

```bash
pnpm --filter @epiquest/rules test                                  # tous les tests du paquet
pnpm --filter @epiquest/rules exec vitest run src/dice/parser.test.ts   # un seul fichier
```

Les tests couvrent chaque règle de la grammaire, chaque code d'erreur avec sa position, et des
allers-retours entre `parseDiceExpression` et `formatDiceExpression`.
