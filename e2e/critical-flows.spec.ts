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

test("pricing reflects the approved external-link launch direction", async ({ page }) => {
  await page.goto("/pricing");
  await waitForApp(page);

  await expect(page.getByText("$19 / GH₵300", { exact: true })).toBeVisible();
  await expect(page.getByText("$39 / GH₵620", { exact: true })).toBeVisible();
  await expect(page.getByText("7% platform fee on sales", { exact: true })).toBeVisible();
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

test("marketplace checkout is explicitly local and changes preview state", async ({ page }) => {
  await page.goto("/marketplace/agent-blueprint-pack");
  await waitForApp(page);

  await page.getByRole("button", { name: "Preview checkout" }).click();
  await expect(page.getByRole("dialog", { name: "Preview checkout" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm preview purchase" }).click();

  await expect(page.getByRole("dialog", { name: "Preview purchase complete" })).toBeVisible();
  await expect(page.getByText("No server order was created.")).toBeVisible();
});
