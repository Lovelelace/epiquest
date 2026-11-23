import { describe, expect, it } from "vitest";
import type { DiceExpression } from "./ast.js";
import { DiceSyntaxError } from "./errors.js";
import { MAX_CONSTANT, MAX_DICE_PER_GROUP } from "./limits.js";
import { parseDiceExpression } from "./parser.js";

/** Forme compacte d'un arbre, sans les positions, pour des assertions lisibles. */
function shape(node: DiceExpression): unknown {
  switch (node.type) {
    case "dice":
      return `${node.count}d${node.sides}`;
    case "number":
      return node.value;
    case "binary":
      return [node.operator, shape(node.left), shape(node.right)];
  }
}

const parse = (input: string): unknown => shape(parseDiceExpression(input));

/** Lance le parseur et renvoie l'erreur levée, pour en vérifier le code et la position. */
function errorOf(input: string): DiceSyntaxError {
  try {
    parseDiceExpression(input);
  } catch (error) {
    if (error instanceof DiceSyntaxError) {
      return error;
    }
    throw error;
  }
  throw new Error(`Aucune erreur levée pour « ${input} »`);
}

describe("parseDiceExpression", () => {
  describe("expressions valides", () => {
    it.each([
      ["2d6", "2d6"],
      ["d20", "1d20"],
      ["D20", "1d20"],
      ["2 d 6", "2d6"],
      ["5", 5],
      [`${MAX_DICE_PER_GROUP}d100`, `${MAX_DICE_PER_GROUP}d100`],
      [`${MAX_CONSTANT}`, MAX_CONSTANT],
    ])("lit « %s »", (input, expected) => {
      expect(parse(input)).toEqual(expected);
    });

    it.each([4, 6, 8, 10, 12, 20, 100])("accepte le dé à %i faces", (sides) => {
      expect(parse(`1d${sides}`)).toBe(`1d${sides}`);
    });

    it("lit une addition", () => {
      expect(parse("2d6+3")).toEqual(["+", "2d6", 3]);
    });

    it("lit une soustraction", () => {
      expect(parse("1d20 - 1")).toEqual(["-", "1d20", 1]);
    });

    it("lit plusieurs groupes de dés", () => {
      expect(parse("1d8+1d6+2")).toEqual(["+", ["+", "1d8", "1d6"], 2]);
    });

    it("associe les opérations de gauche à droite", () => {
      // 10 - 2 - 3 = (10 - 2) - 3, et non 10 - (2 - 3)
      expect(parse("10-2-3")).toEqual(["-", ["-", 10, 2], 3]);
    });
  });

  describe("positions", () => {
    it("donne à chaque nœud sa position dans le texte saisi", () => {
      const tree = parseDiceExpression("2d6 + 3");
      expect(tree).toEqual({
        type: "binary",
        operator: "+",
        span: { start: 0, end: 7 },
        left: { type: "dice", count: 2, sides: 6, span: { start: 0, end: 3 } },
        right: { type: "number", value: 3, span: { start: 6, end: 7 } },
      });
    });

    it("fait commencer un dé sans nombre au « d »", () => {
      expect(parseDiceExpression(" d20").span).toEqual({ start: 1, end: 4 });
    });
  });

  describe("erreurs sur les dés", () => {
    it("refuse un dé qui n'existe pas dans le jeu", () => {
      const error = errorOf("2d7");
      expect(error.code).toBe("INVALID_DIE_SIZE");
      expect(error.span).toEqual({ start: 2, end: 3 });
      expect(error.details).toMatchObject({ sides: 7, allowed: "d4, d6, d8, d10, d12, d20, d100" });
      expect(error.message).toBe(
        "Le dé à 7 faces n'existe pas (position 3). Dés autorisés : d4, d6, d8, d10, d12, d20, d100.",
      );
    });

    it.each(["1d0", "1d1", "1d3", "1d1000"])("refuse « %s »", (input) => {
      expect(errorOf(input).code).toBe("INVALID_DIE_SIZE");
    });

    it("refuse zéro dé", () => {
      const error = errorOf("0d6");
      expect(error.code).toBe("INVALID_DICE_COUNT");
      expect(error.span).toEqual({ start: 0, end: 1 });
    });

    it(`refuse plus de ${MAX_DICE_PER_GROUP} dés dans un groupe`, () => {
      const error = errorOf(`${MAX_DICE_PER_GROUP + 1}d6`);
      expect(error.code).toBe("TOO_MANY_DICE");
      expect(error.details).toEqual({ count: MAX_DICE_PER_GROUP + 1, max: MAX_DICE_PER_GROUP });
      expect(error.message).toBe(
        `Trop de dés : ${MAX_DICE_PER_GROUP + 1} (maximum ${MAX_DICE_PER_GROUP} par groupe).`,
      );
    });

    it.each([
      ["3d", { start: 0, end: 2 }],
      ["d", { start: 0, end: 1 }],
      ["1d6 + d", { start: 6, end: 7 }],
      ["d+3", { start: 0, end: 1 }],
    ])("signale le nombre de faces manquant dans « %s »", (input, span) => {
      const error = errorOf(input);
      expect(error.code).toBe("MISSING_DIE_SIZE");
      expect(error.span).toEqual(span);
    });
  });

  describe("erreurs sur les constantes", () => {
    it(`refuse une constante supérieure à ${MAX_CONSTANT}`, () => {
      const error = errorOf(`1d6+${MAX_CONSTANT + 1}`);
      expect(error.code).toBe("NUMBER_TOO_LARGE");
      expect(error.span).toEqual({ start: 4, end: 8 });
      expect(error.message).toBe(
        `Constante trop grande : ${MAX_CONSTANT + 1} (maximum ${MAX_CONSTANT}).`,
      );
    });
  });

  describe("erreurs de structure", () => {
    it("signale une expression incomplète", () => {
      const error = errorOf("1d6+");
      expect(error.code).toBe("UNEXPECTED_END");
      expect(error.span).toEqual({ start: 4, end: 4 });
      expect(error.details).toEqual({ after: "+" });
      expect(error.message).toBe(
        "L'expression est incomplète : un nombre ou un dé est attendu après « + ».",
      );
    });

    it("signale deux valeurs qui se suivent sans opérateur", () => {
      const error = errorOf("1d6 3");
      expect(error.code).toBe("UNEXPECTED_TOKEN");
      expect(error.span).toEqual({ start: 4, end: 5 });
      expect(error.message).toBe(
        "« 3 » inattendu en position 5 : un opérateur (+ ou -) est attendu.",
      );
    });

    it("cite le texte tel qu'il a été saisi", () => {
      expect(errorOf("1d6 D").message).toContain("« D » inattendu en position 5");
    });

    it("refuse un dé collé à un autre dé", () => {
      expect(errorOf("2d6d6").code).toBe("UNEXPECTED_TOKEN");
    });

    it("refuse deux opérateurs qui se suivent", () => {
      const error = errorOf("1d6+*2");
      expect(error.code).toBe("UNEXPECTED_TOKEN");
      expect(error.message).toBe("« * » inattendu en position 5 : un nombre ou un dé est attendu.");
    });

    it("transmet les erreurs du tokenizer", () => {
      expect(errorOf("1d6#").code).toBe("UNEXPECTED_CHARACTER");
      expect(errorOf("").code).toBe("EMPTY_EXPRESSION");
    });
  });
});
