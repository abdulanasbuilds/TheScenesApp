import { expect, test } from "@playwright/test";
import { waitForApp } from "./helpers";

test("landing search honestly reports an empty catalogue", async ({ page }) => {
  await page.goto("/");
  await waitForApp(page);

  const search = page.getByRole("search");
  await search.getByRole("searchbox").fill("agent");
  await search.getByRole("button", { name: "Explore The Scenes" }).click();

  await expect(page).toHaveURL(/\/search\?.*q=agent/);
  await expect(
    page.getByRole("heading", { name: "Find a scene, lesson, person or resource." }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Courses", exact: true }).click();
  await expect(page.getByText("No results found")).toBeVisible();
});

test("landing page shows honest empty states instead of fabricated content", async ({ page }) => {
  await page.goto("/");
  await waitForApp(page);

  await expect(page.getByText("No communities yet")).toBeVisible();
  await expect(page.getByText("No courses yet")).toBeVisible();
});

test("pricing reflects the approved external-link launch direction", async ({ page }) => {
  await page.goto("/pricing");
  await waitForApp(page);

  await expect(page.getByText("$29", { exact: true })).toBeVisible();
  await expect(page.getByText("$99", { exact: true })).toBeVisible();
  await expect(page.getByText("10% platform fee on sales", { exact: true })).toBeVisible();
  await expect(page.getByText("5% platform fee on sales", { exact: true })).toBeVisible();
  await expect(page.getByText("2% platform fee on sales", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Monthly billing direction · yearly pricing not yet set"),
  ).toBeVisible();
  await expect(page.getByText(/300 GB|1 TB/)).toHaveCount(0);
  await expect(
    page.getByText("Native video and file hosting planned", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Native live streaming and replay planned", { exact: true }),
  ).toHaveCount(0);
});

test("demo login keeps its session through client navigation", async ({ page }) => {
  await page.goto("/login");
  await waitForApp(page);
  await page.getByRole("button", { name: "Log in to preview" }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { name: "Welcome back, Preview." })).toBeVisible();
  await expect(page.getByLabel("Open your profile")).toBeVisible();
});

test("creator event form validates and creates a local draft", async ({ page }) => {
  await page.goto("/dashboard/events");
  await waitForApp(page);
  await page.getByRole("button", { name: "New event" }).first().click();

  await page.getByLabel("Event title").fill("Review clinic");
  await page
    .getByLabel("What will happen?")
    .fill("Members bring one flow and receive a focused, structured review from the host.");
  await page.getByLabel("Status").selectOption("draft");
  await page.getByRole("button", { name: "Create event" }).click();

  await expect(page.getByRole("tab", { name: /Drafts \(1\)/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByText("Review clinic", { exact: true })).toBeVisible();
  await expect(page.getByText("Local", { exact: true })).toBeVisible();
});

test("creator dashboard starts from an honest setup state", async ({ page }) => {
  await page.goto("/dashboard/creator");
  await waitForApp(page);

  await expect(page.getByText("No community yet")).toBeVisible();
  await expect(page.getByText("Finish setting up your workspace")).toBeVisible();
});
