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

test("pricing page presents free early access with no plan tags", async ({ page }) => {
  await page.goto("/pricing");
  await waitForApp(page);

  await expect(
    page.getByRole("heading", { level: 1, name: /free while we build it/i }),
  ).toBeVisible();
  await expect(
    page.getByText("The Scenes is currently free to join, learn, and teach.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("Free for Early Access", { exact: true }).first()).toBeVisible();

  // No paid plan tags, prices or platform-fee percentages on the public page.
  for (const forbidden of [
    "$29",
    "$99",
    "10% platform fee on sales",
    "5% platform fee on sales",
    "2% platform fee on sales",
    "Start free. Upgrade when your community grows.",
    "Monthly billing direction · yearly pricing not yet set",
  ]) {
    await expect(page.getByText(forbidden, { exact: true })).toHaveCount(0);
  }
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

test("marketplace stays honest without sample products", async ({ page }) => {
  await page.goto("/marketplace");
  await waitForApp(page);

  await expect(page.getByText("No resources yet")).toBeVisible();

  // The previously fabricated sample product is no longer routable.
  await page.goto("/marketplace/agent-blueprint-pack");
  await expect(page.getByRole("heading", { name: "This page has left the stage." })).toBeVisible();
});

test("onboarding hands a new learner to the home surface", async ({ page }) => {
  await page.goto("/onboarding");
  await waitForApp(page);

  await expect(page.getByRole("heading", { name: "What brings you here?" })).toBeVisible();
  await page.getByRole("radio", { name: /I want to learn/ }).click();
  await page.getByRole("button", { name: "AI", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "How should we introduce you?" })).toBeVisible();
  await page.getByLabel("Display name").fill("Ama Boateng");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Start with one useful lesson." })).toBeVisible();
  // No catalogue is invented, so no first lesson is forced; the handoff stays honest.
  await expect(page.getByText("Explore the catalogue next")).toBeVisible();
  await page.getByRole("button", { name: "Enter The Scenes" }).click();

  await expect(page).toHaveURL(/\/home$/);
});
