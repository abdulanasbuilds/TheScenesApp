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
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  failOnFlakyTests: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Keep local route sweeps below the dev server's saturation point. Four fully
  // parallel workers caused intermittent missed UI updates/timeouts; three still
  // exercises all target viewports concurrently without turning load into flake.
  workers: process.env.CI ? 1 : 3,
  reporter: [["list"], ["html", { outputFolder: "./.playwright/report", open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },
    {
      // Mobile-first is a product requirement; keep a device profile in the
      // default run so mobile regressions are caught, not discovered later.
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: isExternalServer
    ? undefined
    : {
        command: "bun run dev",
        url: baseURL,
        reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
        env: {
          ...process.env,
          VITE_DATA_MODE: process.env.VITE_DATA_MODE ?? "fixtures",
        },
        timeout: 120_000,
      },
});
