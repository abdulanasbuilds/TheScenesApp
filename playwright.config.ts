import { defineConfig, devices } from "@playwright/test";

/**
 * Browser verification config for The Scenes.
 *
 * Scope: route verification, responsive checks, and critical user flows in the
 * browser — see `docs/TOOLING.md` (Browser/UI verification).
 *
 * The app is served by Vite on port 5000 (see `vite.config.ts`, strictPort).
 * Set `PLAYWRIGHT_BASE_URL` to test an already-running server instead.
 */
const PORT = Number(process.env.PORT ?? 5000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const isExternalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./.playwright/test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { outputFolder: "./.playwright/report", open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Mobile-first is a product requirement; keep a device profile in the
      // default run so mobile regressions are caught, not discovered later.
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: isExternalServer
    ? undefined
    : {
        command: "bun run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
