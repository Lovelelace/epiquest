import { DiceSyntaxError, type Span } from "./errors.js";
import { MAX_EXPRESSION_LENGTH } from "./limits.js";

export type SymbolKind = "d" | "+" | "-" | "*" | "/" | "(" | ")";

/** Unité de la notation, avec sa position dans le texte saisi. */
export type Token =
  | { kind: "number"; value: number; span: Span }
  | { kind: SymbolKind; span: Span }
  | { kind: "end"; span: Span };

const SYMBOLS: Readonly<Record<string, SymbolKind>> = {
  d: "d",
  D: "d",
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  "(": "(",
  ")": ")",
};

const isDigit = (char: string): boolean => char >= "0" && char <= "9";
const isWhitespace = (char: string): boolean => /\s/u.test(char);

/**
 * Découpe une expression de dés en tokens. Les espaces sont ignorés et `D` vaut `d`.
 * La liste se termine toujours par un token `end`. L'ordre des tokens n'est pas vérifié ici :
 * c'est le rôle du parseur.
 *
 * @throws DiceSyntaxError si la saisie est vide, trop longue ou contient un caractère inconnu.
 */
export function tokenize(input: string): Token[] {
  if (input.length > MAX_EXPRESSION_LENGTH) {
    throw new DiceSyntaxError(
      "EXPRESSION_TOO_LONG",
      `L'expression est trop longue : ${input.length} caractères (maximum ${MAX_EXPRESSION_LENGTH}).`,
      { start: MAX_EXPRESSION_LENGTH, end: input.length },
      { length: input.length, max: MAX_EXPRESSION_LENGTH },
    );
  }
  if (input.trim() === "") {
    throw new DiceSyntaxError("EMPTY_EXPRESSION", "L'expression est vide.", {
      start: 0,
      end: input.length,
    });
  }

  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    // Un caractère complet, même hors du plan de base Unicode (émoji, par exemple).
    const char = String.fromCodePoint(input.codePointAt(index) ?? 0);

    if (isWhitespace(char)) {
      index += char.length;
      continue;
    }

    if (isDigit(char)) {
      const start = index;
      while (index < input.length && isDigit(input.charAt(index))) {
        index += 1;
      }
      tokens.push({
        kind: "number",
        value: Number(input.slice(start, index)),
        span: { start, end: index },
      });
      continue;
    }

    const symbol = SYMBOLS[char];
    if (symbol) {
      tokens.push({ kind: symbol, span: { start: index, end: index + 1 } });
      index += 1;
      continue;
    }

    throw new DiceSyntaxError(
      "UNEXPECTED_CHARACTER",
      `Caractère inattendu « ${char} » en position ${index + 1}.`,
      { start: index, end: index + char.length },
      { character: char, position: index + 1 },
    );
  }

  tokens.push({ kind: "end", span: { start: input.length, end: input.length } });
  return tokens;
}
