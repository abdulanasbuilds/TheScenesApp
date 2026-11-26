import { expect, test } from "@playwright/test";
import { waitForApp } from "./helpers";

test("landing search reaches course discovery", async ({ page }) => {
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
  await expect(page.getByRole("link", { name: /Ship Your First AI Agent/ })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Welcome back, Ama." })).toBeVisible();
  await expect(page.getByLabel("Open your profile")).toBeVisible();
});

test("a published fixture post appears on the community feed", async ({ page }) => {
  await page.goto("/c/ai-builders-guild/posts/new");
  await waitForApp(page);

  await page.getByLabel("Title").fill("Playwright build note");
  await page
    .getByRole("textbox", { name: "Post body", exact: true })
    .fill("Here is the constraint, what I tried, and the specific result I need help reviewing.");
  await page.getByRole("button", { name: "Publish post" }).click();

  await expect(
    page.getByRole("heading", { name: "Your post is on the local feed." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View community feed" }).click();

  await expect(page).toHaveURL(/\/c\/ai-builders-guild\/?$/);
  await expect(page.getByText("Playwright build note", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Playwright build note", exact: true }).click();
  await page.getByRole("button", { name: "Discussion actions" }).click();
  await page.getByRole("menuitem", { name: "Edit post" }).click();
  await expect(page.getByRole("heading", { name: "Edit post" })).toBeVisible();

  await page.getByLabel("Title").fill("Playwright build note — updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Your post was updated." })).toBeVisible();
  await page.getByRole("link", { name: "View community feed" }).click();
  await expect(page.getByText("Playwright build note — updated", { exact: true })).toBeVisible();
});

test("lesson completion updates the learning view", async ({ page }) => {
  await page.goto("/c/ai-builders-guild/classroom/ship-your-first-ai-agent/les-agents-3");
  await waitForApp(page);

  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();

  await page.getByRole("link", { name: "My learning" }).first().click();
  await expect(page).toHaveURL(/\/my-learning$/);
  await expect(page.getByRole("heading", { name: "Ship Your First AI Agent" })).toBeVisible();
  await expect(page.getByText("50%", { exact: true })).toBeVisible();
});

test("creator event form validates and creates a local draft", async ({ page }) => {
  await page.goto("/dashboard/events");
  await waitForApp(page);
  await page.getByRole("button", { name: "New event" }).click();

  await page.getByLabel("Event title").fill("Fixture review clinic");
  await page
    .getByLabel("What will happen?")
    .fill("Members bring one fixture flow and receive a focused, structured review from the host.");
  await page.getByLabel("Status").selectOption("draft");
  await page.getByRole("button", { name: "Create event" }).click();

  await expect(page.getByRole("tab", { name: /Drafts \(1\)/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByText("Fixture review clinic", { exact: true })).toBeVisible();
  await expect(page.getByText("Local", { exact: true })).toBeVisible();
});

test("marketplace add-to-library is free, local and never charges", async ({ page }) => {
  await page.goto("/marketplace/agent-blueprint-pack");
  await waitForApp(page);

  await page.getByRole("button", { name: "Get it free" }).click();
  await expect(page.getByRole("dialog", { name: "Get this resource — free" })).toBeVisible();
  await page.getByRole("button", { name: "Add to my library" }).click();

  await expect(page.getByRole("dialog", { name: "Added to your library" })).toBeVisible();
  await expect(page.getByText(/No order was created and no payment was taken/)).toBeVisible();
});

test("onboarding hands a new learner straight to a free first lesson", async ({ page }) => {
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
  await page.getByRole("button", { name: "Enter The Scenes" }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { name: /Welcome back, Ama/ })).toBeVisible();
  await expect(page.getByText("Welcome to The Scenes, Ama")).toBeVisible();

  await page.getByRole("button", { name: "Start first lesson" }).click();
  await expect(page).toHaveURL(/\/classroom\/.+\/.+/);
});
