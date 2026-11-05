import { expect, test } from "@playwright/test";
import { waitForApp } from "./helpers";
import { canonicalRoutes } from "./routes";

test("all 30 canonical routes return their application page", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Route existence is checked once on desktop.");

  for (const route of canonicalRoutes) {
    const response = await request.get(route);
    expect(response.ok(), `${route} returned ${response.status()}`).toBeTruthy();
    expect(await response.text(), `${route} rendered the not-found page`).not.toContain(
      "This page has left the stage.",
    );
  }
});

test("internal links discovered across primary pages resolve", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The internal-link graph is checked once.");
  test.setTimeout(120_000);
  const discovered = new Set<string>();

  for (const route of canonicalRoutes) {
    await page.goto(route);
    await waitForApp(page);
    const links = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors
        .map((anchor) => new URL((anchor as HTMLAnchorElement).href, window.location.href))
        .filter((url) => url.origin === window.location.origin)
        .map((url) => `${url.pathname}${url.search}`),
    );
    links.forEach((href) => discovered.add(href));
  }

  for (const href of discovered) {
    const response = await request.get(href);
    expect(response.ok(), `${href} returned ${response.status()}`).toBeTruthy();
    expect(await response.text(), `${href} rendered the not-found page`).not.toContain(
      "This page has left the stage.",
    );
  }
});
