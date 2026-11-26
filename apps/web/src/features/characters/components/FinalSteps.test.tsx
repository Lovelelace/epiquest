import { EMPTY_DRAFT_CHOICES } from "@epiquest/schemas";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockApi } from "../test-api";
import { CreationWizard } from "./CreationWizard";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  push.mockReset();
});

const DRAFT_ID = "11111111-1111-4111-8111-111111111111";
const choices = {
  ...EMPTY_DRAFT_CHOICES,
  species: "high-elf",
  class: "wizard",
  background: "acolyte",
  abilityMethod: "standard-array" as const,
  baseAbilityScores: { str: 8, dex: 13, con: 14, int: 15, wis: 12, cha: 10 },
};

describe("Assistant de création : compétences, équipement, sorts, récapitulatif", () => {
  it("ne propose que les compétences de la classe non déjà maîtrisées, dans la limite", async () => {
    const api = mockApi({ step: "skills", choices });
    render(<CreationWizard draftId={DRAFT_ID} />);
    expect(await screen.findByText("Perception, Perspicacité, Religion")).toBeDefined();
    expect(screen.queryByRole("checkbox", { name: "Perspicacité" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Arcanes" }));
    await waitFor(() => expect(api.current().choices.chosenSkills).toEqual(["arcana"]));
    fireEvent.click(await screen.findByRole("checkbox", { name: "Histoire" }));
    await waitFor(() => expect(api.current().choices.chosenSkills).toEqual(["arcana", "history"]));
    const investigation = await screen.findByRole("checkbox", { name: "Investigation" });
    expect(investigation.hasAttribute("disabled")).toBe(true);
  });

  it("enregistre l'option d'équipement choisie", async () => {
    const api = mockApi({ step: "equipment", choices });
    render(<CreationWizard draftId={DRAFT_ID} />);
    expect(await screen.findByText("1 × Spellbook")).toBeDefined();
    fireEvent.click(screen.getByRole("radio", { name: "1 × Dagger" }));
    await waitFor(() => expect(api.current().choices.equipment).toEqual([1]));
  });

  it("propose les sorts mineurs et les sorts du 1er niveau de la classe", async () => {
    const api = mockApi({ step: "spells", choices });
    render(<CreationWizard draftId={DRAFT_ID} />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Fire Bolt" }));
    await waitFor(() => expect(api.current().choices.cantrips).toEqual(["fire-bolt"]));
    expect(screen.getByRole("group", { name: "Sorts du 1er niveau" })).toBeDefined();
    expect(screen.queryByRole("checkbox", { name: "Fireball" })).toBeNull();
  });

  it("liste ce qui reste à corriger, puis crée le personnage et ouvre sa fiche", async () => {
    const api = mockApi({ step: "summary", choices });
    render(<CreationWizard draftId={DRAFT_ID} />);
    expect(await screen.findByText("Donnez un nom à votre personnage.")).toBeDefined();
    const name = screen.getByLabelText("Nom du personnage");
    fireEvent.change(name, { target: { value: "Elara" } });
    fireEvent.blur(name);
    await waitFor(() => expect(api.current().choices.name).toBe("Elara"));
    fireEvent.click(screen.getByRole("button", { name: "Créer le personnage" }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/personnages/33333333-3333-4333-8333-333333333333"),
    );
  });

  it("annonce le refus du serveur", async () => {
    mockApi({ step: "summary", choices });
    render(<CreationWizard draftId={DRAFT_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Créer le personnage" }));
    expect((await screen.findByRole("alert")).textContent).toContain("ne respecte pas les règles");
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    mockApi({ step: "skills", choices });
    const { container } = render(<CreationWizard draftId={DRAFT_ID} />);
    await screen.findByRole("checkbox", { name: "Arcanes" });
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
