import { render, screen } from "@testing-library/react-native";
import HomeScreen from "./HomeScreen";

describe("Écran d'accueil", () => {
  it("affiche le titre comme en-tête pour les lecteurs d'écran", async () => {
    await render(<HomeScreen />);
    expect(screen.getByRole("header", { name: "EpiQuest" })).toBeOnTheScreen();
  });
});
