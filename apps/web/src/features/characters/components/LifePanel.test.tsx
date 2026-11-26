import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApi } from "../test-api";
import { TEST_CHARACTER } from "../test-character";
import { LifePanel } from "./LifePanel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Vie du personnage", () => {
  it("envoie les dégâts au serveur et affiche les PV renvoyés", async () => {
    const api = mockApi();
    const onChange = vi.fn();
    render(<LifePanel character={TEST_CHARACTER} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Montant", { selector: "input[min='0']" }), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Dégâts" }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(api.actions).toEqual([{ type: "damage", amount: 3 }]);
    expect(onChange.mock.calls[0]?.[0].state.currentHitPoints).toBe(5);
    expect(screen.getByRole("status", { name: "Résultat de l'action" }).textContent).toBe(
      "3 dégâts appliqués.",
    );
  });

  it("affiche le poids porté et l'encombrement calculés par le moteur", () => {
    mockApi();
    render(<LifePanel character={TEST_CHARACTER} onChange={vi.fn()} />);
    expect(screen.getByText("Poids porté : 10 lb sur 120 lb (non encombré).")).toBeDefined();
    expect(screen.getByText(/15 gp, 0 pp \(soit 15 po en tout\)/)).toBeDefined();
  });

  it("annonce le refus du serveur pour une dépense trop élevée", async () => {
    mockApi();
    render(<LifePanel character={TEST_CHARACTER} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Dépenser" }));
    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Résultat de l'action" }).textContent).toBe(
        "La bourse ne contient pas assez d'argent.",
      ),
    );
  });

  it("équipe un objet depuis l'inventaire", async () => {
    const api = mockApi();
    render(<LifePanel character={TEST_CHARACTER} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Équiper Spellbook" }));
    await waitFor(() =>
      expect(api.actions).toEqual([{ type: "equip-item", slug: "spellbook", isEquipped: true }]),
    );
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    mockApi();
    const { container } = render(<LifePanel character={TEST_CHARACTER} onChange={vi.fn()} />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
