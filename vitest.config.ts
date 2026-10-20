import { defineConfig } from "vitest/config";

// Unit and build tests only; the browser journeys in tests/e2e run with Playwright (`just e2e`).
export default defineConfig({
  test: {
    include: ["tests/*.test.ts"],
  },
});
