import { expect, test } from "@playwright/test";
import { waitForApp } from "./helpers";

test("connected registration, viewer, profile and logout journey", async ({ page }, testInfo) => {
  test.skip(process.env.VITE_DATA_MODE !== "supabase-local", "connected Auth suite only");

  const suffix = `${testInfo.project.name}-${Date.now().toString(36)}`.replace(/[^a-z0-9-]/g, "");
  const email = `browser.${suffix}@test.invalid`;
  const handle = `browser${suffix.replaceAll("-", "")}`.slice(0, 30);
  const password = "connected-local-password-123";

  await page.goto("/register");
  await waitForApp(page);
  await page.getByLabel("Full name").fill("Connected Learner");
  await page.getByLabel("Profile handle").fill(handle);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("I agree to the local proof terms").check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Your account and profile are saved")).toBeVisible();
  const authCookies = (await page.context().cookies()).filter((cookie) =>
    cookie.name.includes("auth-token"),
  );
  expect(authCookies.length).toBeGreaterThan(0);

  await page.getByRole("link", { name: "Continue to onboarding" }).click();
  await expect(page.getByLabel("Profile handle")).toHaveValue(handle);
  await expect(page.getByLabel("Profile handle")).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Enter The Scenes" }).click();

  await expect(page.getByRole("heading", { name: /Welcome back, Connected/ })).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByLabel("Handle")).toHaveValue(handle);
  await expect(page.getByLabel("Handle")).toHaveAttribute("readonly", "");
  await page.getByLabel("Display name").fill("Connected Learner Updated");
  await page.getByLabel("Headline").fill("Learning through the connected local proof");
  await page.getByLabel("Location").fill("Local test environment");
  await page
    .getByLabel("About you")
    .fill("A fictional learner used only for the isolated local authentication verification flow.");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Account" }).click();
  await expect(page.getByLabel("Email")).toHaveValue(email);
  await expect(page.getByLabel("Email")).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (await page.context().cookies()).filter((cookie) => cookie.name.includes("auth-token")),
  ).toEqual([]);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { name: /Welcome back, Connected/ })).toBeVisible();
});
