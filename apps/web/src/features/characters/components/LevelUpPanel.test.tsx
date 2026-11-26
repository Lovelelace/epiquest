import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApi } from "../test-api";
import { TEST_CHARACTER } from "../test-character";
import { LevelUpPanel } from "./LevelUpPanel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const status = () => screen.getByRole("status", { name: "Résultat de la montée de niveau" });

describe("Montée de niveau", () => {
  it("envoie la méthode de PV et la sous-classe, puis affiche le nouveau niveau", async () => {
    const api = mockApi();
    const onChange = vi.fn();
    render(<LevelUpPanel character={TEST_CHARACTER} onChange={onChange} />);
    fireEvent.click(await screen.findByRole("radio", { name: /Jet de 1d6/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Evocation" }));
    fireEvent.click(screen.getByRole("button", { name: "Passer au niveau 2" }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(api.levelUps).toEqual([
      {
        hitPointMethod: "roll",
        subclass: "evocation",
        abilityScoreImprovement: [],
        expertise: [],
        cantrips: [],
        spells: ["magic-missile"],
      },
    ]);
    expect(status().textContent).toBe(`${TEST_CHARACTER.name} passe au niveau 2.`);
  });

  it("annonce les erreurs du moteur renvoyées par le serveur", async () => {
    mockApi();
    render(<LevelUpPanel character={TEST_CHARACTER} onChange={vi.fn()} />);
    const form = (await screen.findByRole("button", { name: "Passer au niveau 2" })).closest(
      "form",
    );
    if (!form) throw new Error("formulaire attendu");
    fireEvent.submit(form);
    await waitFor(() => expect(status().textContent).toContain("Choisissez une sous-classe."));
  });

  it("indique le niveau maximal au niveau 5", () => {
    mockApi();
    render(<LevelUpPanel character={{ ...TEST_CHARACTER, level: 5 }} onChange={vi.fn()} />);
    expect(screen.getByText("Le niveau 5 est le plus haut niveau pris en charge.")).toBeDefined();
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    mockApi();
    const { container } = render(<LevelUpPanel character={TEST_CHARACTER} onChange={vi.fn()} />);
    await screen.findByRole("button", { name: "Passer au niveau 2" });
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
