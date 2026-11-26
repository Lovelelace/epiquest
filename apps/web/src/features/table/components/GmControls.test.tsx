import { TABLE_EVENTS, type TableAck } from "@epiquest/schemas";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { gmState } from "../test-fixtures";
import { GmControls, rectangle } from "./GmControls";

afterEach(cleanup);

function renderControls(reply: TableAck = { ok: true }) {
  const send = vi.fn<(event: string, payload: unknown) => Promise<TableAck>>(() =>
    Promise.resolve(reply),
  );
  const view = render(<GmControls state={gmState} send={send} />);
  return { send, ...view };
}

const LYRA = gmState.tokens[0]!;

describe("GmControls", () => {
  it("déplace le jeton sélectionné avec les flèches du clavier", async () => {
    const { send } = renderControls();
    fireEvent.keyDown(screen.getByRole("button", { name: "Droite" }), { key: "ArrowRight" });
    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(send).toHaveBeenCalledWith(TABLE_EVENTS.moveToken, {
      campaignId: gmState.campaignId,
      tokenId: LYRA.id,
      position: { column: 1, row: 0 },
    });
  });

  it("envoie une intention de jet, jamais un résultat", async () => {
    const { send } = renderControls();
    fireEvent.change(screen.getByLabelText("Dés (par exemple 1d20+2)"), {
      target: { value: "2d6+1" },
    });
    fireEvent.change(screen.getByLabelText("Visibilité"), { target: { value: "gm" } });
    fireEvent.click(screen.getByRole("button", { name: "Lancer" }));
    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(send).toHaveBeenCalledWith(TABLE_EVENTS.roll, {
      campaignId: gmState.campaignId,
      label: "Initiative",
      notation: "2d6+1",
      visibility: "gm",
    });
  });

  it("révèle une zone rectangulaire saisie au clavier", async () => {
    const { send } = renderControls();
    fireEvent.change(screen.getByLabelText("À la colonne"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("À la ligne"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Révéler la zone" }));
    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(send).toHaveBeenCalledWith(TABLE_EVENTS.setFog, {
      campaignId: gmState.campaignId,
      cells: [
        { column: 0, row: 0 },
        { column: 1, row: 0 },
      ],
      isRevealed: true,
    });
  });

  it("envoie les nouveaux PV du jeton sélectionné", async () => {
    const { send } = renderControls();
    fireEvent.change(screen.getByLabelText("PV actuels (maximum 12)"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Appliquer les PV" }));
    await waitFor(() => expect(send).toHaveBeenCalled());
    expect(send).toHaveBeenCalledWith(TABLE_EVENTS.setHitPoints, {
      campaignId: gmState.campaignId,
      tokenId: LYRA.id,
      current: 4,
    });
  });

  it("annonce le refus du serveur", async () => {
    renderControls({
      ok: false,
      error: { code: "OUT_OF_MAP", message: "Cette case est en dehors de la carte." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Haut" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "Refusé : Cette case est en dehors de la carte.",
      ),
    );
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    const { container } = renderControls();
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("rectangle", () => {
  it("couvre toutes les cases entre deux coins donnés dans n'importe quel ordre", () => {
    expect(rectangle({ column: 1, row: 1 }, { column: 0, row: 0 })).toEqual([
      { column: 0, row: 0 },
      { column: 1, row: 0 },
      { column: 0, row: 1 },
      { column: 1, row: 1 },
    ]);
  });
});
