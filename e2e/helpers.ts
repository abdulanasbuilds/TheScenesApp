import { expect, type Page } from "@playwright/test";

export async function waitForApp(page: Page) {
  await expect(page.locator("html[data-app-ready='true']")).toBeAttached();
}
