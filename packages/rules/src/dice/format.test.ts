import { describe, expect, it } from "vitest";
import type { DiceExpression } from "./ast.js";
import { formatDiceExpression } from "./format.js";
import { parseDiceExpression } from "./parser.js";

const canonical = (input: string): string => formatDiceExpression(parseDiceExpression(input));

/** Arbre sans les positions, qui changent forcément quand le texte change. */
function withoutSpans(node: DiceExpression): unknown {
  switch (node.type) {
    case "dice":
      return { type: node.type, count: node.count, sides: node.sides };
    case "number":
      return { type: node.type, value: node.value };
    case "negate":
      return { type: node.type, operand: withoutSpans(node.operand) };
    case "binary":
      return {
        type: node.type,
        operator: node.operator,
        left: withoutSpans(node.left),
        right: withoutSpans(node.right),
      };
  }
}

describe("formatDiceExpression", () => {
  it.each([
    ["2D6+3", "2d6 + 3"],
    ["d20", "1d20"],
    ["  1d8 +1d6-   2 ", "1d8 + 1d6 - 2"],
    ["((1d4))", "1d4"],
    ["(1d6+2)*2", "(1d6 + 2) * 2"],
    ["1+(2*3)", "1 + 2 * 3"],
    ["(1+2)+3", "1 + 2 + 3"],
    ["1+(2+3)", "1 + (2 + 3)"],
    ["10-(2-3)", "10 - (2 - 3)"],
    ["(8/2)/2", "8 / 2 / 2"],
    ["8/(2/2)", "8 / (2 / 2)"],
    ["4d6*100", "4d6 * 100"],
  ])("écrit « %s » sous la forme « %s »", (input, expected) => {
    expect(canonical(input)).toBe(expected);
  });

  describe("moins unaire", () => {
    it.each([
      ["- 1d4", "-1d4"],
      ["-1d4+3", "-1d4 + 3"],
      ["-(1d6+2)", "-(1d6 + 2)"],
      ["-2*3", "-2 * 3"],
      ["(-2)*3", "-2 * 3"],
    ])("écrit « %s » sous la forme « %s »", (input, expected) => {
      expect(canonical(input)).toBe(expected);
    });

    it.each([
      ["1d6*(-1)", "1d6 * (-1)"],
      ["1d6+(-2)", "1d6 + (-2)"],
      ["1+(-2*3)", "1 + (-2) * 3"],
      ["-(-3)", "-(-3)"],
    ])("garde les parenthèses là où le moins unaire l'exige : « %s »", (input, expected) => {
      expect(canonical(input)).toBe(expected);
    });
  });

  describe("aller-retour", () => {
    const samples = [
      "2d6+3",
      "d20",
      "1d8+1d6-2",
      "10-2-3",
      "10-(2-3)",
      "2*(1d6+(3-1))",
      "(1d20+5)/2",
      "-1d4",
      "-(1d6+2)*2",
      "1d6*(-1)",
      "1+(-2*3)",
      "-(-3)",
      "((1+2)*(3-1))/(2*2)",
      "100d100*1000",
    ];

    it.each(samples)("relire la forme canonique de « %s » redonne le même arbre", (input) => {
      const tree = parseDiceExpression(input);
      const reparsed = parseDiceExpression(formatDiceExpression(tree));
      expect(withoutSpans(reparsed)).toEqual(withoutSpans(tree));
    });

    it.each(samples)("la forme canonique de « %s » est stable", (input) => {
      const once = canonical(input);
      expect(canonical(once)).toBe(once);
    });
  });
});
