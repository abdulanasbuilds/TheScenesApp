import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { waitForApp } from "./helpers";
import { canonicalRoutes } from "./routes";

const screenshotRoutes = new Map<string, string>([
  ["/", "landing"],
  ["/explore", "explore"],
  ["/c/ai-builders-guild", "community-feed"],
  ["/c/ai-builders-guild/classroom/ship-your-first-ai-agent/les-agents-1", "lesson-viewer"],
  ["/dashboard/creator", "creator-dashboard"],
  ["/marketplace", "marketplace"],
]);

test("all primary routes render without runtime errors or page overflow", async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000);
  const runtimeErrors = new Map<string, string[]>();
  let currentRoute = "startup";

  page.on("pageerror", (error) => {
    runtimeErrors.set(currentRoute, [...(runtimeErrors.get(currentRoute) ?? []), error.message]);
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    runtimeErrors.set(currentRoute, [...(runtimeErrors.get(currentRoute) ?? []), message.text()]);
  });

  await mkdir(".playwright/qa-screenshots", { recursive: true });

  for (const route of canonicalRoutes) {
    currentRoute = route;
    runtimeErrors.set(route, []);
    await page.goto(route);
    await waitForApp(page);

    await expect(
      page.locator("main").first(),
      `${route} has no visible main landmark`,
    ).toBeVisible();
    await expect(page.locator("h1").first(), `${route} has no visible page heading`).toBeVisible();
    await expect(
      page.getByText("This page has left the stage."),
      `${route} rendered the 404 page`,
    ).toHaveCount(0);

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(
      Math.max(layout.documentWidth, layout.bodyWidth),
      `${route} overflows the ${layout.viewport}px ${testInfo.project.name} viewport`,
    ).toBeLessThanOrEqual(layout.viewport + 1);

    const screenshotName = screenshotRoutes.get(route);
    if (screenshotName) {
      await page.screenshot({
        path: `.playwright/qa-screenshots/${testInfo.project.name}-${screenshotName}.jpg`,
        fullPage: true,
        type: "jpeg",
        quality: 72,
      });
    }

    expect(runtimeErrors.get(route), `${route} logged a browser error`).toEqual([]);
  }
});
