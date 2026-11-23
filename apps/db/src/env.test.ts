import { describe, expect, it } from "vitest";
import { getDatabaseUrl, loadRootEnvFile } from "./env.js";

describe("getDatabaseUrl", () => {
  it("renvoie DATABASE_URL quand elle est définie", () => {
    expect(getDatabaseUrl({ DATABASE_URL: "postgres://localhost/test" })).toBe(
      "postgres://localhost/test",
    );
  });

  it("échoue avec un message explicite quand elle manque", () => {
    expect(() => getDatabaseUrl({})).toThrow(/DATABASE_URL/);
  });
});

describe("loadRootEnvFile", () => {
  it("ne fait rien si le fichier n'existe pas", () => {
    expect(() => loadRootEnvFile("/chemin/inexistant/.env")).not.toThrow();
  });
});
