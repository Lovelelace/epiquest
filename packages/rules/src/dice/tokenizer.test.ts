import { describe, expect, it } from "vitest";
import { DiceSyntaxError } from "./errors.js";
import { MAX_EXPRESSION_LENGTH } from "./limits.js";
import { tokenize, type Token } from "./tokenizer.js";

/** Tokens sans leurs positions, pour comparer uniquement leur nature et leur valeur. */
function kinds(tokens: Token[]): (string | number)[] {
  return tokens.map((token) => (token.kind === "number" ? token.value : token.kind));
}

/** Lance tokenize et renvoie l'erreur levée, pour en vérifier le code et la position. */
function errorOf(input: string): DiceSyntaxError {
  try {
    tokenize(input);
  } catch (error) {
    if (error instanceof DiceSyntaxError) {
      return error;
    }
    throw error;
  }
  throw new Error(`Aucune erreur levée pour « ${input} »`);
}

describe("tokenize", () => {
  describe("découpage", () => {
    it("découpe 2d6+3 en nombre, d, nombre, +, nombre, fin", () => {
      expect(kinds(tokenize("2d6+3"))).toEqual([2, "d", 6, "+", 3, "end"]);
    });

    it("lit les nombres de plusieurs chiffres", () => {
      expect(kinds(tokenize("10d100"))).toEqual([10, "d", 100, "end"]);
    });

    it("reconnaît les opérateurs et les parenthèses", () => {
      expect(kinds(tokenize("(1d4+2)*3/2-1"))).toEqual([
        "(",
        1,
        "d",
        4,
        "+",
        2,
        ")",
        "*",
        3,
        "/",
        2,
        "-",
        1,
        "end",
      ]);
    });

    it("accepte un d sans nombre de dés devant", () => {
      expect(kinds(tokenize("d20"))).toEqual(["d", 20, "end"]);
    });

    it("n'impose pas d'ordre aux tokens (vérifié par le parseur)", () => {
      expect(kinds(tokenize("++d"))).toEqual(["+", "+", "d", "end"]);
    });
  });

  describe("positions", () => {
    it("donne à chaque token sa position dans le texte d'origine", () => {
      expect(tokenize("12d6 + 3").map((token) => token.span)).toEqual([
        { start: 0, end: 2 },
        { start: 2, end: 3 },
        { start: 3, end: 4 },
        { start: 5, end: 6 },
        { start: 7, end: 8 },
        { start: 8, end: 8 },
      ]);
    });
  });

  describe("tolérance de saisie", () => {
    it("ignore les espaces", () => {
      expect(kinds(tokenize(" 2 d 6 +  3 "))).toEqual(kinds(tokenize("2d6+3")));
    });

    it("ignore les tabulations et les espaces insécables", () => {
      expect(kinds(tokenize("2d6\t+ 3"))).toEqual([2, "d", 6, "+", 3, "end"]);
    });

    it("accepte D majuscule comme d", () => {
      expect(kinds(tokenize("2D6"))).toEqual([2, "d", 6, "end"]);
    });
  });

  describe("erreurs", () => {
    it.each(["#", "k", "!", "x", "é"])("refuse le caractère « %s »", (char) => {
      const error = errorOf(`1d6${char}`);
      expect(error.code).toBe("UNEXPECTED_CHARACTER");
      expect(error.span).toEqual({ start: 3, end: 4 });
      expect(error.details).toEqual({ character: char, position: 4 });
      expect(error.message).toBe(`Caractère inattendu « ${char} » en position 4.`);
    });

    it("signale un émoji comme un seul caractère", () => {
      const error = errorOf("1d6🎲");
      expect(error.code).toBe("UNEXPECTED_CHARACTER");
      expect(error.details.character).toBe("🎲");
      expect(error.span).toEqual({ start: 3, end: 5 });
    });

    it.each(["", "   ", "\t"])("refuse une saisie vide (%j)", (input) => {
      const error = errorOf(input);
      expect(error.code).toBe("EMPTY_EXPRESSION");
      expect(error.message).toBe("L'expression est vide.");
    });

    it(`accepte une saisie de ${MAX_EXPRESSION_LENGTH} caractères`, () => {
      const input = "1".padEnd(MAX_EXPRESSION_LENGTH, " ");
      expect(() => tokenize(input)).not.toThrow();
    });

    it(`refuse une saisie de plus de ${MAX_EXPRESSION_LENGTH} caractères`, () => {
      const input = "1".padEnd(MAX_EXPRESSION_LENGTH + 1, " ");
      const error = errorOf(input);
      expect(error.code).toBe("EXPRESSION_TOO_LONG");
      expect(error.details).toEqual({
        length: MAX_EXPRESSION_LENGTH + 1,
        max: MAX_EXPRESSION_LENGTH,
      });
    });

    it("lève une DiceSyntaxError, qui reste une Error", () => {
      const error = errorOf("#");
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("DiceSyntaxError");
    });
  });
});
