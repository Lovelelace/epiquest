import type { BinaryOperator, DiceExpression, DiceNode, NumberNode } from "./ast.js";
import { DiceSyntaxError } from "./errors.js";
import { DIE_SIZES, isDieSize, MAX_CONSTANT, MAX_DICE_PER_GROUP } from "./limits.js";
import { tokenize, type Token } from "./tokenizer.js";

const ALLOWED_DICE = DIE_SIZES.map((sides) => `d${sides}`).join(", ");

/**
 * Analyse une expression de dés et renvoie son arbre syntaxique.
 *
 * Grammaire actuelle :
 *
 * ```text
 * expression = operand { ("+" | "-") operand }
 * operand    = dice | number
 * dice       = [ number ] "d" number
 * ```
 *
 * @throws DiceSyntaxError si l'expression est invalide, avec la position de l'erreur.
 */
export function parseDiceExpression(input: string): DiceExpression {
  return new Parser(input).parse();
}

class Parser {
  private readonly tokens: Token[];
  /** Dernier token de la liste, toujours de type « end ». */
  private readonly endToken: Token;
  private index = 0;

  constructor(private readonly input: string) {
    this.tokens = tokenize(input);
    this.endToken = this.tokens[this.tokens.length - 1] ?? {
      kind: "end",
      span: { start: input.length, end: input.length },
    };
  }

  parse(): DiceExpression {
    const expression = this.parseExpression();
    const next = this.peek();
    if (next.kind !== "end") {
      throw this.unexpected(next, "un opérateur (+ ou -) est attendu");
    }
    return expression;
  }

  private parseExpression(): DiceExpression {
    let left: DiceExpression = this.parseOperand();
    let next = this.peek();
    while (next.kind === "+" || next.kind === "-") {
      const operator: BinaryOperator = next.kind;
      this.advance();
      const right = this.parseOperand();
      left = {
        type: "binary",
        operator,
        left,
        right,
        span: { start: left.span.start, end: right.span.end },
      };
      next = this.peek();
    }
    return left;
  }

  private parseOperand(): DiceNode | NumberNode {
    const token = this.peek();

    if (token.kind === "d") {
      this.advance();
      return this.parseDice(1, token, token.span.start);
    }

    if (token.kind === "number") {
      this.advance();
      const next = this.peek();
      if (next.kind === "d") {
        this.advance();
        return this.parseDice(token.value, next, token.span.start, token);
      }
      if (token.value > MAX_CONSTANT) {
        throw new DiceSyntaxError(
          "NUMBER_TOO_LARGE",
          `Constante trop grande : ${token.value} (maximum ${MAX_CONSTANT}).`,
          token.span,
          { value: token.value, max: MAX_CONSTANT },
        );
      }
      return { type: "number", value: token.value, span: token.span };
    }

    if (token.kind === "end") {
      const previous = this.tokens[this.index - 1];
      const after = previous ? ` après « ${this.text(previous)} »` : "";
      throw new DiceSyntaxError(
        "UNEXPECTED_END",
        `L'expression est incomplète : un nombre ou un dé est attendu${after}.`,
        token.span,
        previous ? { after: this.text(previous) } : {},
      );
    }

    throw this.unexpected(token, "un nombre ou un dé est attendu");
  }

  /** Lit le nombre de faces après le « d » et vérifie le groupe de dés. */
  private parseDice(count: number, dToken: Token, start: number, countToken?: Token): DiceNode {
    const sidesToken = this.peek();
    if (sidesToken.kind !== "number") {
      throw new DiceSyntaxError(
        "MISSING_DIE_SIZE",
        `Il manque le nombre de faces après « d » en position ${dToken.span.start + 1}.`,
        { start, end: dToken.span.end },
        { position: dToken.span.start + 1 },
      );
    }
    this.advance();

    if (countToken && count < 1) {
      throw new DiceSyntaxError(
        "INVALID_DICE_COUNT",
        `Le nombre de dés doit être d'au moins 1 (position ${countToken.span.start + 1}).`,
        countToken.span,
        { count, position: countToken.span.start + 1 },
      );
    }
    if (countToken && count > MAX_DICE_PER_GROUP) {
      throw new DiceSyntaxError(
        "TOO_MANY_DICE",
        `Trop de dés : ${count} (maximum ${MAX_DICE_PER_GROUP} par groupe).`,
        countToken.span,
        { count, max: MAX_DICE_PER_GROUP },
      );
    }

    const sides = sidesToken.value;
    if (!isDieSize(sides)) {
      throw new DiceSyntaxError(
        "INVALID_DIE_SIZE",
        `Le dé à ${sides} faces n'existe pas (position ${sidesToken.span.start + 1}). Dés autorisés : ${ALLOWED_DICE}.`,
        sidesToken.span,
        { sides, allowed: ALLOWED_DICE, position: sidesToken.span.start + 1 },
      );
    }

    return { type: "dice", count, sides, span: { start, end: sidesToken.span.end } };
  }

  private unexpected(token: Token, expected: string): DiceSyntaxError {
    const text = this.text(token);
    const position = token.span.start + 1;
    return new DiceSyntaxError(
      "UNEXPECTED_TOKEN",
      `« ${text} » inattendu en position ${position} : ${expected}.`,
      token.span,
      { token: text, position },
    );
  }

  private peek(): Token {
    return this.tokens[this.index] ?? this.endToken;
  }

  private advance(): void {
    if (this.index < this.tokens.length - 1) {
      this.index += 1;
    }
  }

  /** Texte d'origine d'un token, tel que saisi (par exemple « D » plutôt que « d »). */
  private text(token: Token): string {
    return this.input.slice(token.span.start, token.span.end);
  }
}
