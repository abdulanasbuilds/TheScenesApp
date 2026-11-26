import { expect, test } from "@playwright/test";

/**
 * WhatsApp direct-chat feedback (ADR-048).
 *
 * This spec only runs when the WhatsApp channel is selected for the dev server, so the default
 * fixture sweep stays green:
 *
 *   FEEDBACK_PROVIDER=whatsapp WHATSAPP_FEEDBACK_NUMBER=+233201234567 \
 *     bun run test:e2e e2e/feedback-whatsapp.spec.ts
 *
 * It proves the two acceptance paths: the one-tap pre-filled link, and the in-app submit that the
 * server turns into a prepared WhatsApp handoff.
 */
const NUMBER = (process.env.WHATSAPP_FEEDBACK_NUMBER ?? "")
  .trim()
  .replace(/[\s().-]/g, "")
  .replace(/^00/, "")
  .replace(/^\+/, "");
const enabled = process.env.FEEDBACK_PROVIDER === "whatsapp" && NUMBER.length > 0;

test.skip(
  !enabled,
  "Set FEEDBACK_PROVIDER=whatsapp and WHATSAPP_FEEDBACK_NUMBER to run this spec.",
);

// The first load compiles the feedback server function, which can take longer than the global
// 20-second expect timeout on a cold dev server.
const SLOW = { timeout: 90_000 } as const;

// The badge is rendered only after the client fetches the channel status and hydrates, so waiting
// for it both proves the WhatsApp channel is active and guarantees the form is interactive.
const whatsappBadge = (page: import("@playwright/test").Page) =>
  page.getByText("WhatsApp direct", { exact: true });

test("offers a one-tap pre-filled WhatsApp link from the help page", async ({ page }) => {
  await page.goto("/help");

  await expect(page.getByRole("heading", { name: /Talk to the founder/i })).toBeVisible(SLOW);
  await expect(whatsappBadge(page)).toBeVisible(SLOW);

  const link = page.getByRole("link", { name: "Open WhatsApp directly" });
  await expect(link).toBeVisible(SLOW);
  const href = await link.getAttribute("href");
  expect(href?.startsWith(`https://wa.me/${NUMBER}?text=`)).toBe(true);

  const text = decodeURIComponent(href?.split("text=")[1] ?? "");
  expect(text).toContain("Category: General feedback");
  expect(text).toContain("Route: /help");
});

test("turns an in-app submission into a prepared WhatsApp handoff", async ({ page }) => {
  await page.goto("/help");

  // Wait for hydration before typing, so the submit handler is attached instead of a native submit.
  await expect(whatsappBadge(page)).toBeVisible(SLOW);

  await page
    .getByLabel("What should we know?")
    .fill("The mobile nav hides the help link at 375px.");
  await page.getByRole("button", { name: "Send to founder via WhatsApp" }).click();

  await expect(page.getByText("Your note is ready in WhatsApp")).toBeVisible(SLOW);
  const open = page.getByRole("link", { name: "Open WhatsApp" });
  await expect(open).toHaveAttribute("href", new RegExp(`^https://wa.me/${NUMBER}\\?text=`), SLOW);
});
