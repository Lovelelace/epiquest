import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import type { TableAck } from "@epiquest/schemas";
import { gmState } from "../test-fixtures";
import { GmTable } from "./GmTable";

afterEach(cleanup);

const PLAYERS_HREF = "/campagnes/x/joueurs?utilisateur=demo-gm";
const send = (): Promise<TableAck> => Promise.resolve({ ok: true });

const renderGm = () =>
  render(
    <GmTable
      state={gmState}
      status="connected"
      refusal={null}
      playersViewHref={PLAYERS_HREF}
      send={send}
    />,
  );

describe("GmTable", () => {
  it("ouvre la vue joueurs dans une seconde fenêtre, annoncée dans le libellé", () => {
    renderGm();
    const link = screen.getByRole("link", { name: "Ouvrir la vue joueurs (nouvelle fenêtre)" });
    expect(link.getAttribute("href")).toBe(PLAYERS_HREF);
    expect(link.getAttribute("target")).toBe("epiquest-vue-joueurs");
  });

  it("montre au MJ les jetons cachés et leurs notes", () => {
    renderGm();
    expect(screen.getByRole("row", { name: /Chef gobelin/ }).textContent).toContain("Non (caché)");
    expect(screen.getByText("Embusqué derrière les ruines.")).toBeDefined();
  });

  it("signale les jets secrets autrement que par la couleur", () => {
    renderGm();
    expect(screen.getByText("[Secret]")).toBeDefined();
  });

  it("affiche le refus du serveur", () => {
    render(
      <GmTable
        state={null}
        status="refused"
        refusal="Cette action est réservée au MJ."
        playersViewHref={PLAYERS_HREF}
        send={send}
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("Cette action est réservée au MJ.");
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    const { container } = renderGm();
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
