import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * P4-S5 conformance tests.
 *
 * These do not execute the worker (there is no DOM in a unit test); they verify the shipped artifacts
 * against the plan's hard rules: an owned manifest, real icons, a narrowly allowlisted cache, and an
 * offline shell that contains no personal or protected content.
 */

const root = process.cwd();
const publicPath = (...parts: string[]) => join(root, "public", ...parts);

function readText(...parts: string[]): string {
  return readFileSync(publicPath(...parts), "utf8");
}

function extractArray(source: string, name: string): string[] {
  const match = source.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\]`));
  if (!match) throw new Error(`Array ${name} not found`);
  const constants = Object.fromEntries(
    [...source.matchAll(/const ([A-Z_]{3,}) = "([^"]+)";/g)].map((entry) => [entry[1], entry[2]]),
  );
  const body = match[1].replace(/\b[A-Z_]{3,}\b/g, (token) =>
    constants[token] === undefined ? token : `"${constants[token]}"`,
  );
  return [...body.matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

const manifest = JSON.parse(readText("manifest.webmanifest")) as {
  id: string;
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: ReadonlyArray<{ src: string; sizes: string; type: string; purpose?: string }>;
};

const worker = readText("sw.js");
const offline = readText("offline.html");

describe("P4-S5 manifest", () => {
  test("declares installability fields and a root scope", () => {
    expect(manifest.name.length).toBeGreaterThan(0);
    expect(manifest.short_name.length).toBeGreaterThan(0);
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("references owned 192/512/maskable icons that exist on disk", () => {
    const sizes = manifest.icons.map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

    const pngSignature = [0x89, 0x50, 0x4e, 0x47];
    for (const icon of manifest.icons) {
      const file = join(root, "public", ...icon.src.split("/").filter(Boolean));
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(100);
      const bytes = readFileSync(file).subarray(0, 4);
      expect([...bytes]).toEqual(pngSignature);
    }
  });
});

describe("P4-S5 service worker cache allowlist", () => {
  test("may only cache versioned static assets and the offline shell", () => {
    expect(extractArray(worker, "CACHEABLE_PREFIXES")).toEqual(["/assets/", "/icons/"]);
    expect(extractArray(worker, "CACHEABLE_EXACT")).toEqual([
      "/offline.html",
      "/manifest.webmanifest",
    ]);
  });

  test("never caches server functions, APIs, notifications or authenticated areas", () => {
    const never = extractArray(worker, "NEVER_CACHE_PREFIXES");
    expect(never).toContain("/_server");
    expect(never).toContain("/api");
    expect(never).toContain("/notifications");
  });

  test("sends navigations to the network and falls back only to the offline shell", () => {
    expect(worker).toContain('if (request.mode === "navigate")');
    expect(worker).toMatch(/return await fetch\(request\)/);
    expect(worker).toContain("cache.match(OFFLINE_URL)");
    // A cached HTML document must never be served in place of a live navigation.
    expect(worker).not.toMatch(/cache\.match\(request\)[\s\S]{0,40}navigate/);
  });

  test("gates every write behind the static allowlist", () => {
    expect(worker).toContain('if (request.method !== "GET") return;');
    expect(worker).toContain("if (!isCacheable(url)) return;");
    // The cache write only happens after the allowlist check, for same-origin basic responses.
    expect(worker).toContain("cache.put(request, response.clone())");
    expect(worker).toContain('response.type === "basic"');
  });

  test("does not swap code mid-session during install", () => {
    const installBlock = worker.slice(
      worker.indexOf('self.addEventListener("install"'),
      worker.indexOf('self.addEventListener("activate"'),
    );
    expect(installBlock.length).toBeGreaterThan(0);
    expect(installBlock).not.toContain("skipWaiting");
  });
});

describe("P4-S5 offline shell", () => {
  test("is a generic, non-personalized page", () => {
    expect(offline).toContain("You are offline");
    expect(offline).toContain("generic offline shell");
    for (const forbidden of ["localStorage", "sessionStorage", "document.cookie", "Ama Boateng"]) {
      expect(offline).not.toContain(forbidden);
    }
  });

  test("links only to public destinations", () => {
    const hrefs = [...offline.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href.startsWith("/")).toBe(true);
      expect(href.startsWith("/c/")).toBe(false);
      expect(href.startsWith("/dashboard")).toBe(false);
    }
  });
});
