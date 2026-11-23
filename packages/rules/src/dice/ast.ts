import type { Span } from "./errors.js";
import type { DieSize } from "./limits.js";

/** Groupe de dés identiques : `2d6`, ou `d20` (compris comme `1d20`). */
export interface DiceNode {
  type: "dice";
  count: number;
  sides: DieSize;
  span: Span;
}

/** Constante entière : `3`. */
export interface NumberNode {
  type: "number";
  value: number;
  span: Span;
}

export type BinaryOperator = "+" | "-";

/** Opération entre deux sous-expressions : `1d6 + 3`. */
export interface BinaryNode {
  type: "binary";
  operator: BinaryOperator;
  left: DiceExpression;
  right: DiceExpression;
  span: Span;
}

/** Arbre syntaxique d'une expression de dés. */
export type DiceExpression = DiceNode | NumberNode | BinaryNode;
