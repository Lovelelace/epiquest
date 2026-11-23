import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApi } from "../test-api";
import { TEST_CHARACTER } from "../test-character";
import { CharacterSheet } from "./CharacterSheet";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Fiche de personnage interactive", () => {
  it("affiche les statistiques calculées par le serveur", async () => {
    mockApi();
    render(<CharacterSheet characterId={TEST_CHARACTER.id} />);
    expect(await screen.findByRole("heading", { level: 1, name: "Elara" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Arcanes (maîtrise) +5" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Sauvegarde de Intelligence (maîtrise) +5" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Attaque : Quarterstaff +1" })).toBeDefined();
  });

  it("envoie seulement l'intention du jet et annonce le résultat du serveur", async () => {
    const api = mockApi();
    render(<CharacterSheet characterId={TEST_CHARACTER.id} />);
    fireEvent.click(await screen.findByRole("button", { name: "Arcanes (maîtrise) +5" }));
    const status = screen.getByRole("status", { name: "Résultat du jet" });
    await waitFor(() => expect(status.textContent).toBe("Arcanes : 16 (d20 11, modificateur +5)."));
    expect(api.rollRequests).toEqual([{ kind: "skill", key: "arcana", visibility: "public" }]);
  });

  it("transmet la visibilité choisie et n'affiche pas le résultat d'un jet caché", async () => {
    const api = mockApi();
    render(<CharacterSheet characterId={TEST_CHARACTER.id} />);
    fireEvent.click(
      await screen.findByRole("radio", { name: "Caché (le MJ seul voit le résultat)" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Arcanes (maîtrise) +5" }));
    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Résultat du jet" }).textContent).toBe(
        "Arcanes : jet caché lancé, seul le MJ voit le résultat.",
      ),
    );
    expect(api.rollRequests).toEqual([{ kind: "skill", key: "arcana", visibility: "hidden" }]);
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    mockApi();
    const { container } = render(<CharacterSheet characterId={TEST_CHARACTER.id} />);
    await screen.findByRole("heading", { level: 1, name: "Elara" });
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
