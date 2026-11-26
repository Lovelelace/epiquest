import { defineConfig } from "vitest/config";

// PostgreSQL embarqué (PGlite) : démarrer la base et rejouer toutes les migrations prend
// plusieurs secondes quand `pnpm test` lance tous les packages en parallèle.
const PGLITE_TIMEOUT_MS = 30_000;

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    testTimeout: PGLITE_TIMEOUT_MS,
    hookTimeout: PGLITE_TIMEOUT_MS,
  },
});
