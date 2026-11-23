import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "./page";

afterEach(cleanup);

describe("Page d'accueil", () => {
  it("affiche le titre principal", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: "EpiQuest" })).toBeDefined();
  });

  it("ne présente aucune violation d'accessibilité détectable automatiquement", async () => {
    const { container } = render(<HomePage />);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
