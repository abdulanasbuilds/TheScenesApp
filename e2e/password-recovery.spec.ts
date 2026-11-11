import { expect, test } from "@playwright/test";
import { waitForApp } from "./helpers";

/**
 * Fixture-mode contract for the P4-S1 account email/password recovery journey.
 *
 * These run without any provider connection: the preview must validate input, acknowledge honestly
 * (never claiming an email was sent) and strip recovery parameters from the visible URL before any
 * network call. Connected recovery behaviour is verified separately under explicit approval.
 */

test("forgot-password validates the address and never claims an email was sent", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await waitForApp(page);

  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toHaveCount(0);

  await page.getByLabel("Email address").fill("fictional@test.invalid");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await expect(page.getByText(/no reset email was sent/i)).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/whether or not an account exists/i);
});

test("reset-password strips recovery parameters and refuses in preview", async ({ page }) => {
  await page.goto("/reset-password?code=fixture-code-should-be-stripped&type=recovery");
  await waitForApp(page);

  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(
    page.getByRole("heading", { name: "Recovery is not connected in this preview" }),
  ).toBeVisible();
  await expect(page.getByText(/fixture-code-should-be-stripped/)).toHaveCount(0);

  await page.goto("/reset-password?error=access_denied&error_code=otp_expired");
  await waitForApp(page);

  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(
    page.getByRole("heading", { name: "Recovery is not connected in this preview" }),
  ).toBeVisible();
  await expect(page.getByText(/otp_expired|access_denied/)).toHaveCount(0);
});
