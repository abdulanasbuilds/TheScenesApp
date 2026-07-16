// SukaSpace Service Worker — v1
// Strategy: Cache-first for static assets, network-first for navigation/API.

const CACHE_VERSION = "sukaspace-v1";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon-256.png",
  "/apple-touch-icon.png",
];

// ─── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("sukaspace-") && k !== STATIC_CACHE && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET, cross-origin, or Supabase API requests
  if (
    request.method !== "GET" ||
    !url.origin.startsWith(self.location.origin) ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co")
  ) {
    return;
  }

  // Images → cache-first (long TTL)
  if (request.destination === "image" || /\.(png|jpg|jpeg|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Static build assets (JS/CSS bundles) → cache-first
  if (url.pathname.startsWith("/_build/") || /\.(js|css|woff2?)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation requests → network-first (SSR needs fresh HTML)
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Everything else → network with cache fallback
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Network unavailable", { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response("Network unavailable", { status: 503 });
  }
}

// ─── Push notifications (future) ─────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json?.() ?? { title: "SukaSpace", body: "You have a new notification" };
  event.waitUntil(
    self.registration.showNotification(data.title ?? "SukaSpace", {
      body: data.body,
      icon: "/favicon-256.png",
      badge: "/favicon-32.png",
    })
  );
});
