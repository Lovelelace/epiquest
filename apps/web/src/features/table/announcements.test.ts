import { describe, expect, it } from "vitest";
import { describeChanges } from "./announcements";
import { playerView } from "./test-fixtures";

describe("describeChanges", () => {
  it("annonce le chargement de la table", () => {
    expect(describeChanges(null, playerView)).toEqual([
      "Table « Clairière des ruines » chargée : 2 jetons visibles.",
    ]);
  });

  it("annonce un déplacement avec une position comptée à partir de 1", () => {
    const next = {
      ...playerView,
      tokens: playerView.tokens.map((token) =>
        token.name === "Lyra" ? { ...token, position: { column: 2, row: 0 } } : token,
      ),
    };
    expect(describeChanges(playerView, next)).toEqual(["Lyra se déplace en colonne 3, ligne 1."]);
  });

  it("annonce l'apparition et la disparition d'un jeton", () => {
    const wolf = {
      id: "0d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e5",
      name: "Loup",
      kind: "creature" as const,
      position: { column: 1, row: 0 },
      health: { type: "approximate" as const, status: "unharmed" as const },
    };
    const next = { ...playerView, tokens: [playerView.tokens[0]!, wolf] };
    expect(describeChanges(playerView, next)).toEqual([
      "Loup apparaît en colonne 2, ligne 1.",
      "Gobelin éclaireur n'est plus visible.",
    ]);
  });

  it("annonce un nouveau jet public", () => {
    const roll = { ...playerView.rolls[0]!, id: "d4d4d4d4-0000-4000-8000-000000000009", total: 7 };
    const next = { ...playerView, rolls: [...playerView.rolls, roll] };
    expect(describeChanges(playerView, next)).toEqual(["Jet « Attaque de Lyra » (1d20+5) : 7."]);
  });

  it("annonce un changement d'état de santé", () => {
    const next = {
      ...playerView,
      tokens: playerView.tokens.map((token) =>
        token.kind === "creature"
          ? { ...token, health: { type: "approximate" as const, status: "down" as const } }
          : token,
      ),
    };
    expect(describeChanges(playerView, next)).toEqual(["Gobelin éclaireur : À terre."]);
  });

  it("annonce les cases révélées", () => {
    const next = {
      ...playerView,
      revealedCells: [...playerView.revealedCells, { column: 2, row: 0 }],
    };
    expect(describeChanges(playerView, next)).toEqual(["1 cases révélées."]);
  });
});
