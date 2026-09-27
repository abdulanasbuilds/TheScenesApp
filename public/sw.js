// The Scenes Service Worker — v1
// Strategy: Cache-first for static assets, network-first for navigation/API.

const CACHE_VERSION = "the-scenes-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = ["/", "/manifest.json", "/favicon-256.png", "/apple-touch-icon.png"];

// ─── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)));
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("the-scenes-") && k !== STATIC_CACHE && k !== IMAGE_CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET or cross-origin requests
  if (
    request.method !== "GET" ||
    !url.origin.startsWith(self.location.origin) ||
    url.pathname.startsWith("/api/")
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

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Offline · The Scenes</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      color: #1E293B;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      max-width: 400px;
      width: 100%;
      border: 1px solid #E2E8F0;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 8px 0;
      color: #0F172A;
    }
    p {
      font-size: 14px;
      color: #64748B;
      line-height: 1.5;
      margin: 0 0 20px 0;
    }
    button {
      background-color: #1D4ED8;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #1E40AF;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📶</div>
    <h1>You are currently offline</h1>
    <p>The Scenes is cached on your device, but the requested page requires a live connection. Check your internet connection and try again.</p>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`;

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
    if (cached) return cached;

    // If request mode is navigate (visiting a page), serve our offline HTML fallback
    if (request.mode === "navigate") {
      return new Response(OFFLINE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 200,
      });
    }

    return new Response("Network unavailable", { status: 503 });
  }
}

// ─── Push notifications (future) ─────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json?.() ?? { title: "The Scenes", body: "You have a new notification" };
  event.waitUntil(
    self.registration.showNotification(data.title ?? "The Scenes", {
      body: data.body,
      icon: "/favicon-256.png",
      badge: "/favicon-32.png",
    }),
  );
});
