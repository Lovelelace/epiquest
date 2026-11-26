import { EMPTY_DRAFT_CHOICES } from "@epiquest/schemas";
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
const origin = {
  ...EMPTY_DRAFT_CHOICES,
  species: "high-elf",
  class: "wizard",
  background: "acolyte",
};

describe("Assistant de création : caractéristiques", () => {
  it("affiche le budget restant de l'achat de points", async () => {
    mockApi({ step: "abilities", choices: { ...origin, abilityMethod: "point-buy" } });
    render(<CreationWizard draftId={DRAFT_ID} />);
    expect(await screen.findByText("Points restants : 27 sur 27.")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Force"), { target: { value: "15" } });
    expect(await screen.findByText("Points restants : 18 sur 27.")).toBeDefined();
  });

  it("signale un budget dépassé et n'enregistre pas la répartition", async () => {
    const api = mockApi({ step: "abilities", choices: { ...origin, abilityMethod: "point-buy" } });
    render(<CreationWizard draftId={DRAFT_ID} />);
    for (const label of ["Force", "Dextérité", "Constitution", "Intelligence"]) {
      fireEvent.change(await screen.findByLabelText(label), { target: { value: "15" } });
    }
    expect(await screen.findByText("Budget dépassé de 9 points.")).toBeDefined();
    expect(api.current().choices.baseAbilityScores).toBeNull();
  });

  it("applique et affiche les bonus d'espèce", async () => {
    mockApi({
      step: "abilities",
      choices: {
        ...origin,
        abilityMethod: "standard-array",
        baseAbilityScores: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
      },
    });
    render(<CreationWizard draftId={DRAFT_ID} />);
    const intelligence = (await screen.findByRole("rowheader", { name: "Intelligence" })).closest(
      "tr",
    );
    await waitFor(() => expect(intelligence?.textContent).toContain("+1"));
    expect(intelligence?.textContent).toContain("16");
    expect(intelligence?.textContent).toContain("+3");
  });

  it("répartit le tableau standard et enregistre une répartition complète", async () => {
    const api = mockApi({
      step: "abilities",
      choices: { ...origin, abilityMethod: "standard-array" },
    });
    render(<CreationWizard draftId={DRAFT_ID} />);
    const assignment = {
      Force: "8",
      Dextérité: "14",
      Constitution: "13",
      Intelligence: "15",
      Sagesse: "12",
      Charisme: "10",
    };
    for (const [label, value] of Object.entries(assignment)) {
      fireEvent.change(await screen.findByLabelText(label), { target: { value } });
    }
    await waitFor(() =>
      expect(api.current().choices.baseAbilityScores).toEqual({
        str: 8,
        dex: 14,
        con: 13,
        int: 15,
        wis: 12,
        cha: 10,
      }),
    );
    expect(await screen.findByText("Toutes les valeurs sont réparties.")).toBeDefined();
  });

  it("fait tirer les dés par le serveur puis propose les valeurs tirées", async () => {
    const api = mockApi({ step: "abilities", choices: { ...origin, abilityMethod: "rolled" } });
    render(<CreationWizard draftId={DRAFT_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Lancer les dés" }));
    expect(await screen.findByText("Valeurs à répartir : 15, 14, 13, 12, 10, 8.")).toBeDefined();
    expect(api.fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/ability-rolls"),
      expect.anything(),
    );
    expect(screen.queryByRole("button", { name: "Lancer les dés" })).toBeNull();
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    mockApi({ step: "abilities", choices: { ...origin, abilityMethod: "point-buy" } });
    const { container } = render(<CreationWizard draftId={DRAFT_ID} />);
    await screen.findByText("Points restants : 27 sur 27.");
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
