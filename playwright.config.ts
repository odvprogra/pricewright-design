import { defineConfig, devices } from "@playwright/test";

// The prototype's journeys (the usability test's tasks) against the built site, on a desktop and a
// phone, with axe on every screen (handbook §14.3, §14.5).
const PORT = 8124;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}/prototype/`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "node scripts/site.ts && node scripts/serve.ts",
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}/prototype/`,
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
});
