import type { BinaryOperator, DiceExpression } from "./ast.js";

/** Priorité d'un nœud : plus elle est haute, plus il se lie fortement à ses voisins. */
function precedence(node: DiceExpression): number {
  switch (node.type) {
    case "binary":
      return binaryPrecedence(node.operator);
    case "negate":
      return 3;
    case "dice":
    case "number":
      return 4;
  }
}

function binaryPrecedence(operator: BinaryOperator): number {
  return operator === "+" || operator === "-" ? 1 : 2;
}

/**
 * Écrit une expression sous sa forme canonique : `d20` devient `1d20`, `2D6+3` devient
 * `2d6 + 3`, et seules les parenthèses nécessaires sont gardées. C'est la forme enregistrée
 * dans l'historique et affichée aux joueurs. Relire le texte produit redonne le même arbre.
 */
export function formatDiceExpression(node: DiceExpression): string {
  return format(node, true);
}

/**
 * @param leading vrai si le nœud est en tête d'expression ou juste après « ( » : seul endroit
 * où le parseur accepte un moins unaire sans parenthèses.
 */
function format(node: DiceExpression, leading: boolean): string {
  switch (node.type) {
    case "dice":
      return `${node.count}d${node.sides}`;

    case "number":
      return String(node.value);

    case "negate": {
      const operand =
        precedence(node.operand) === 4
          ? format(node.operand, false)
          : `(${format(node.operand, true)})`;
      return leading ? `-${operand}` : `(-${operand})`;
    }

    case "binary": {
      const own = binaryPrecedence(node.operator);
      // À gauche, une priorité égale se passe de parenthèses (lecture de gauche à droite) ;
      // à droite, elle en exige : 10 - (2 - 3) n'est pas 10 - 2 - 3.
      const left =
        precedence(node.left) < own ? `(${format(node.left, true)})` : format(node.left, leading);
      const right =
        precedence(node.right) <= own ? `(${format(node.right, true)})` : format(node.right, false);
      return `${left} ${node.operator} ${right}`;
    }
  }
}
