/*
 * The Scenes service worker (P4-S5).
 *
 * Scope of this worker is deliberately narrow. It exists to make versioned public static assets and
 * a generic offline shell available on a weak connection — nothing else.
 *
 * It MUST NOT cache, and never serves a cached copy of:
 *   - HTML documents and navigation responses (they may contain private, per-user content);
 *   - Supabase, server-function or API responses (`/_server`, `/api`);
 *   - notifications, settings, learning or any protected/authenticated content;
 *   - cookies, authorization headers or any credentialed request.
 *
 * Anything that is not on the explicit static allowlist below is left entirely to the network.
 *
 * Rollback: unregister the worker (see `src/features/pwa/pwa-experience.tsx`) and remove the manifest
 * link; the application continues as an ordinary web page.
 */

const VERSION = "thescenes-pwa-v1";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";

/* The only path prefixes that may ever be written to the cache. */
const CACHEABLE_PREFIXES = ["/assets/", "/icons/"];

/* Exact files that may be cached: the offline shell and the web app manifest. */
const CACHEABLE_EXACT = [OFFLINE_URL, "/manifest.webmanifest"];

/* Never cached, even if a path above matched. Defence in depth. */
const NEVER_CACHE_PREFIXES = ["/_server", "/api", "/notifications", "/settings", "/dashboard"];

function isCacheable(url) {
  if (url.origin !== self.location.origin) return false;
  if (NEVER_CACHE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return false;
  if (CACHEABLE_EXACT.includes(url.pathname)) return true;
  return CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

/* Precache only the offline shell. Versioned assets are cached on first use. */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll([OFFLINE_URL]);
      // Intentionally no immediate activation: a new worker waits until the page asks, so an update
      // never swaps code mid-session.
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/* The page posts "SKIP_WAITING" when the user chooses to reload onto the new version. */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Navigations: straight to the network. If the network is unreachable, show the generic offline
  // shell. A cached HTML document is never substituted for a live one.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return offline || Response.error();
        }
      })(),
    );
    return;
  }

  // Everything not on the static allowlist is network-only.
  if (!isCacheable(url)) return;

  // Static allowlist: cache-first, then network, and only same-origin basic responses are stored.
  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })(),
  );
});
