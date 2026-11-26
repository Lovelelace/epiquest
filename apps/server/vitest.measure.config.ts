import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Mesures de performance (CODE-25) : hors de `pnpm test`, pour ne pas rendre la CI instable
// (TEST-05). Lancement : pnpm --filter @epiquest/server measure:sync
export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    include: ["src/**/*.measure.ts"],
    testTimeout: 120_000,
  },
});
