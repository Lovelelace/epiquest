import { cleanup, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { playerView } from "../test-fixtures";
import { PlayerTable } from "./PlayerTable";

afterEach(cleanup);

const renderView = () =>
  render(
    <PlayerTable
      view={playerView}
      status="connected"
      refusal={null}
      announcements={["Lyra se déplace."]}
    />,
  );

describe("PlayerTable", () => {
  it("ne propose aucune commande qui modifie la partie", () => {
    renderView();
    expect(screen.queryAllByRole("button")).toEqual([]);
    expect(screen.queryAllByRole("textbox")).toEqual([]);
    expect(screen.queryAllByRole("combobox")).toEqual([]);
    expect(screen.queryAllByRole("checkbox")).toEqual([]);
  });

  it("donne la liste des jetons visibles avec leur position et leur santé", () => {
    renderView();
    const goblin = screen.getByRole("row", { name: /Gobelin éclaireur/ });
    expect(within(goblin).getByText("colonne 2, ligne 2")).toBeDefined();
    expect(within(goblin).getByText("En sang")).toBeDefined();
    expect(within(screen.getByRole("row", { name: /Lyra/ })).getByText("9 / 12 PV")).toBeDefined();
  });

  it("affiche les jets publics", () => {
    renderView();
    expect(screen.getByText("Attaque de Lyra")).toBeDefined();
  });

  it("place les annonces dans une zone aria-live polie", () => {
    const { container } = renderView();
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toContain("Lyra se déplace.");
  });

  it("affiche l'état de la connexion en texte", () => {
    render(<PlayerTable view={null} status="reconnecting" refusal={null} announcements={[]} />);
    expect(screen.getByRole("status").textContent).toContain("reconnexion");
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    const { container } = renderView();
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
