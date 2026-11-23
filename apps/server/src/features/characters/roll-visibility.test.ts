import type { CharacterRoll } from "@epiquest/schemas";
import { describe, expect, it } from "vitest";
import { rollForViewer } from "./roll-visibility.js";

const roll: CharacterRoll = {
  id: "44444444-4444-4444-8444-444444444444",
  label: "Discrétion",
  expression: "1d20 + 5",
  dice: [{ sides: 20, value: 12 }],
  modifier: 5,
  total: 17,
  visibility: "public",
  rolledAt: "2026-11-23T10:00:00.000Z",
};

describe("rollForViewer", () => {
  it("montre un jet public à tout le monde", () => {
    expect(rollForViewer(roll, "owner")).toEqual(roll);
    expect(rollForViewer(roll, "other-player")).toEqual(roll);
  });

  it("n'envoie pas un jet privé aux autres joueurs", () => {
    const privateRoll = { ...roll, visibility: "private" as const };
    expect(rollForViewer(privateRoll, "owner")).toEqual(privateRoll);
    expect(rollForViewer(privateRoll, "game-master")).toEqual(privateRoll);
    expect(rollForViewer(privateRoll, "other-player")).toBeNull();
  });

  it("n'envoie ni les dés ni le total d'un jet caché au joueur", () => {
    const hidden = { ...roll, visibility: "hidden" as const };
    const seen = rollForViewer(hidden, "owner");
    expect(seen).toMatchObject({ label: "Discrétion", dice: [], total: null });
    expect(JSON.stringify(seen)).not.toContain("17");
    expect(JSON.stringify(seen)).not.toContain('"value":12');
    expect(rollForViewer(hidden, "game-master")).toEqual(hidden);
    expect(rollForViewer(hidden, "other-player")).toBeNull();
  });
});
