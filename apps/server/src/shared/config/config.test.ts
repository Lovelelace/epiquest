import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const DATABASE_URL = "postgres://localhost/test";

describe("loadConfig", () => {
  it("applique les valeurs par défaut", () => {
    expect(loadConfig({ DATABASE_URL })).toEqual({
      port: 3000,
      webOrigin: "http://localhost:3001",
      databaseUrl: DATABASE_URL,
    });
  });

  it("refuse un port invalide", () => {
    expect(() => loadConfig({ DATABASE_URL, PORT: "abc" })).toThrow(/PORT invalide/);
  });

  it("exige DATABASE_URL", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });
});
