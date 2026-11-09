import { expect, test } from "@playwright/test";
import { waitForApp } from "./helpers";

test.beforeEach(() => {
  test.skip(process.env.VITE_DATA_MODE !== "supabase-staging", "hosted connected suite only");
});

test("hosted catalogue and public community metadata are real", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/explore");
  await waitForApp(page);
  await expect(page.getByText("Connected pre-production catalogue").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Product Design Studio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Builders Guild" })).toBeVisible();

  await page.goto("/communities/product-design-studio");
  await waitForApp(page);
  await expect(page.getByRole("heading", { name: "Product Design Studio" })).toBeVisible();
  await expect(page.getByText("Connected pre-production catalogue", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("anonymous membership mutation is denied by the server", async ({ page }) => {
  await page.goto("/communities/product-design-studio");
  await waitForApp(page);
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/_serverFn/") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Join community" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(401);
});

test("public preview is visible while protected lesson content stays locked", async ({ page }) => {
  await page.goto(
    "/c/product-design-studio/classroom/product-design-foundations/why-product-design",
  );
  await waitForApp(page);
  await expect(page.getByRole("heading", { name: "Why Product Design" })).toBeVisible();
  await expect(page.getByText("Decisions, not decoration")).toBeVisible();

  await page.goto(
    "/c/product-design-studio/classroom/product-design-foundations/the-discovery-mindset",
  );
  await waitForApp(page);
  await expect(page.getByRole("heading", { name: "This lesson is protected" })).toBeVisible();
  await expect(page.getByText("Discovery is not a phase you finish")).toHaveCount(0);
});

test("private community child content is concealed", async ({ page }) => {
  await page.goto("/c/ai-builders-guild/classroom");
  await waitForApp(page);
  await expect(page.getByRole("heading", { name: "Community access required" })).toBeVisible();
  await expect(page.getByText("Ship AI Features with Confidence")).toHaveCount(0);
});
