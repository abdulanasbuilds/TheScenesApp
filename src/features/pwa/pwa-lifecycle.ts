const OWNED_CACHE_PREFIX = "thescenes-pwa-";

/**
 * Retire only The Scenes' root-scope service worker and caches.
 *
 * This is invoked when the server exposes `PWA_MODE=retire`. It deliberately does not unregister a
 * worker from another origin/scope or delete caches that do not carry The Scenes' owned prefix.
 */
export async function retireTheScenesPwa(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => {
        const scope = new URL(registration.scope);
        return scope.origin === window.location.origin && scope.pathname === "/";
      })
      .map((registration) => registration.unregister()),
  );

  if ("caches" in window) {
    const keys = await window.caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(OWNED_CACHE_PREFIX))
        .map((key) => window.caches.delete(key)),
    );
  }
}
