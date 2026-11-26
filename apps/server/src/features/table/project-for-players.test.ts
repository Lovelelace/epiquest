import { playerTableViewSchema, tableStateSchema, type TableState } from "@epiquest/schemas";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { healthStatusOf, projectForPlayers } from "./project-for-players.js";

const state: TableState = tableStateSchema.parse(
  JSON.parse(readFileSync(new URL("./fixtures/table-with-secrets.json", import.meta.url), "utf8")),
);

/** Ce qui part réellement sur le réseau : le JSON sérialisé de la vue joueurs. */
const sentJson = JSON.stringify(projectForPlayers(state));

const tokenIdsSent = (): string[] => projectForPlayers(state).tokens.map((token) => token.id);

describe("projectForPlayers", () => {
  it("produit une vue conforme au schéma strict des joueurs", () => {
    expect(playerTableViewSchema.safeParse(projectForPlayers(state)).success).toBe(true);
  });

  it("n'envoie pas un jeton marqué caché, ni son nom", () => {
    expect(tokenIdsSent()).not.toContain("b2b2b2b2-0000-4000-8000-000000000002");
    expect(sentJson).not.toContain("b2b2b2b2-0000-4000-8000-000000000002");
    expect(sentJson).not.toContain("Chef gobelin embusqué");
  });

  it("n'envoie pas une créature placée dans une case non révélée", () => {
    expect(sentJson).not.toContain("b2b2b2b2-0000-4000-8000-000000000003");
    expect(sentJson).not.toContain("Loup dans la brume");
  });

  it("garde visible un personnage joueur placé dans une case non révélée", () => {
    expect(tokenIdsSent()).toContain("a1a1a1a1-0000-4000-8000-000000000002");
  });

  it("n'envoie aucune note du MJ", () => {
    expect(sentJson).not.toContain("gmNotes");
    expect(sentJson).not.toContain("NOTE-SECRETE");
  });

  it("n'envoie aucun jet secret du MJ", () => {
    expect(sentJson).not.toContain("d4d4d4d4-0000-4000-8000-000000000002");
    expect(sentJson).not.toContain("JET-SECRET");
    expect(sentJson).not.toContain('"visibility"');
  });

  it("envoie les jets publics", () => {
    expect(projectForPlayers(state).rolls.map((roll) => roll.label)).toEqual(["Attaque de Lyra"]);
  });

  it("remplace les PV exacts d'une créature par un état approximatif", () => {
    const goblin = projectForPlayers(state).tokens.find(
      (token) => token.name === "Gobelin éclaireur",
    );
    expect(goblin?.health).toEqual({ type: "approximate", status: "bloodied" });
    expect(JSON.stringify(goblin)).not.toMatch(/"current"|"maximum"/);
  });

  it("garde les PV exacts d'un personnage joueur", () => {
    const lyra = projectForPlayers(state).tokens.find((token) => token.name === "Lyra");
    expect(lyra?.health).toEqual({ type: "exact", current: 9, maximum: 12 });
  });

  it("n'invente pas de santé pour un objet sans PV", () => {
    const chest = projectForPlayers(state).tokens.find((token) => token.name === "Coffre piégé");
    expect(chest?.health).toBeNull();
  });

  it("ne partage aucun objet avec l'état du MJ", () => {
    const view = projectForPlayers(state);
    view.tokens[0]!.position.column = 9;
    view.revealedCells[0]!.row = 7;
    expect(state.tokens[0]?.position.column).toBe(1);
    expect(state.revealedCells[0]?.row).toBe(0);
  });

  it("recopie la révision pour que les clients ignorent un état plus ancien", () => {
    expect(projectForPlayers(state).revision).toBe(12);
  });
});

describe("healthStatusOf", () => {
  it.each([
    [{ current: 7, maximum: 7 }, "unharmed"],
    [{ current: 6, maximum: 7 }, "wounded"],
    [{ current: 4, maximum: 7 }, "wounded"],
    [{ current: 3, maximum: 7 }, "bloodied"],
    [{ current: 5, maximum: 10 }, "bloodied"],
    [{ current: 1, maximum: 10 }, "bloodied"],
    [{ current: 0, maximum: 10 }, "down"],
  ] as const)("classe %o comme %s", (hitPoints, expected) => {
    expect(healthStatusOf(hitPoints)).toBe(expected);
  });
});
