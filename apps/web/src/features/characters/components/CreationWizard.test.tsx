import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApi } from "../test-api";
import { CreationWizard } from "./CreationWizard";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const DRAFT_ID = "11111111-1111-4111-8111-111111111111";

describe("Assistant de création : espèce, classe, historique", () => {
  it("annonce l'étape courante et la marque dans la liste des étapes", async () => {
    mockApi();
    render(<CreationWizard draftId={DRAFT_ID} />);
    expect(
      await screen.findByRole("heading", { level: 2, name: /Étape 1 sur \d+ : Espèce/ }),
    ).toBeDefined();
    expect(screen.getByText("1. Espèce").getAttribute("aria-current")).toBe("step");
  });

  it("bloque l'étape suivante tant que rien n'est choisi", async () => {
    mockApi();
    render(<CreationWizard draftId={DRAFT_ID} />);
    const next = await screen.findByRole("button", { name: "Suivant : Classe" });
    expect(next.hasAttribute("disabled")).toBe(true);
  });

  it("enregistre la sous-espèce choisie dans le brouillon côté serveur", async () => {
    const api = mockApi();
    render(<CreationWizard draftId={DRAFT_ID} />);
    fireEvent.click(await screen.findByRole("radio", { name: "Elf" }));
    fireEvent.click(await screen.findByRole("radio", { name: "High Elf" }));
    await waitFor(() => expect(api.current().choices.species).toBe("high-elf"));
  });

  it("revient en arrière sans perdre les choix", async () => {
    const api = mockApi({
      step: "class",
      choices: { ...mockApi().current().choices, species: "human" },
    });
    render(<CreationWizard draftId={DRAFT_ID} />);
    fireEvent.click(await screen.findByRole("radio", { name: "Wizard" }));
    await waitFor(() => expect(api.current().choices.class).toBe("wizard"));
    fireEvent.click(screen.getByRole("button", { name: "Précédent : Espèce" }));
    const human = await screen.findByRole("radio", { name: "Human" });
    expect((human as HTMLInputElement).checked).toBe(true);
    fireEvent.click(await screen.findByRole("button", { name: "Suivant : Classe" }));
    const wizard = await screen.findByRole("radio", { name: "Wizard" });
    expect((wizard as HTMLInputElement).checked).toBe(true);
  });

  it("déplace le focus sur le titre de la nouvelle étape", async () => {
    mockApi({ choices: { ...mockApi().current().choices, species: "human" } });
    render(<CreationWizard draftId={DRAFT_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Suivant : Classe" }));
    const heading = await screen.findByRole("heading", { level: 2, name: /Classe/ });
    await waitFor(() => expect(document.activeElement).toBe(heading));
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    mockApi({ step: "class" });
    const { container } = render(<CreationWizard draftId={DRAFT_ID} />);
    fireEvent.click(await screen.findByRole("radio", { name: "Wizard" }));
    await screen.findByRole("heading", { level: 3, name: "Wizard" });
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
