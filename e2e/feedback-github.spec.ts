import { expect, test, type Page } from "@playwright/test";

/**
 * GitHub Issues feedback (ADR-049) — UI acceptance in local-preview mode.
 *
 * The GitHub success path needs a private repository and a fine-grained token, which are never
 * present in a local run, so the server-side GitHub contract (title, labels, marker, retry and error
 * classification) is covered by the unit suite with a mocked `fetch`. This browser spec proves the
 * user-facing form, validation and honest success/failure copy against the deterministic in-memory
 * provider, without any credentials.
 *
 * It is skipped only when a real GitHub channel is selected, so the default fixture sweep stays green:
 *
 *   bun run test:e2e e2e/feedback-github.spec.ts
 */
const enabled = process.env.FEEDBACK_PROVIDER !== "github";

test.skip(
  enabled === false,
  "Set FEEDBACK_PROVIDER=memory (the default) to run the local-preview browser checks.",
);

// The first load compiles the feedback server function, which can take longer than the global
// 20-second expect timeout on a cold dev server.
const SLOW = { timeout: 90_000 } as const;

const previewBadge = (page: Page) => page.getByText("Local preview", { exact: true });

test("submits a note and reports a local preview honestly", async ({ page }) => {
  await page.goto("/help");

  await expect(page.getByRole("heading", { name: "Send feedback" })).toBeVisible(SLOW);
  // The badge appears only after hydration, which guarantees the submit handler is attached.
  await expect(previewBadge(page)).toBeVisible(SLOW);

  await page.getByLabel("Category").selectOption("bug");
  await page.getByLabel("Subject").fill("Course enrollment problem");
  await page.getByLabel("What should we know?").fill("The enroll button does nothing on mobile.");
  await page.getByRole("button", { name: "Send feedback" }).click();

  await expect(page.getByText("Saved to the local preview")).toBeVisible(SLOW);
});

test("blocks an empty submission before it reaches the server", async ({ page }) => {
  await page.goto("/help");

  await expect(previewBadge(page)).toBeVisible(SLOW);
  await page.getByRole("button", { name: "Send feedback" }).click();

  await expect(page.getByText(/Add a short subject of at least 3 characters/i)).toBeVisible(SLOW);
});

test("links to the feedback form from the public footer", async ({ page }) => {
  await page.goto("/help");

  const link = page.getByRole("link", { name: "Send feedback" }).last();
  await expect(link).toBeVisible(SLOW);
  await link.click();
  await expect(page).toHaveURL(/#feedback$/, SLOW);
});
