// ─── PWA utilities ───────────────────────────────────────────────────────────
// Service worker registration and haptic feedback helpers.

// ─── Service Worker Registration ─────────────────────────────────────────────

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Check for updates every 60 minutes
        setInterval(() => reg.update(), 60 * 60 * 1000);
      })
      .catch((err) => {
        console.warn("[PWA] SW registration failed:", err);
      });
  });
}

// ─── Haptic Feedback ─────────────────────────────────────────────────────────

/** Fire a 10 ms tactile pulse for standard taps / selections. */
export function hapticTap() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  } catch {
    // Silently ignored — not all browsers support it.
  }
}

/** Fire a double-pulse for milestone unlocks / achievements. */
export function hapticMilestone() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([15, 30, 15]);
    }
  } catch {
    // Silently ignored.
  }
}

/** Fire a light error pulse. */
export function hapticError() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 20, 10, 20, 10]);
    }
  } catch {
    // Silently ignored.
  }
}

// ─── Spring presets ──────────────────────────────────────────────────────────
// Framer Motion spring configs for consistent physics across the UI.

/** Rapid tactile response — buttons, checkboxes, tabs */
export const SPRING_FAST = {
  type: "spring" as const,
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

/** Structural motion — slide-overs, drawers, sheets */
export const SPRING_STRUCTURAL = {
  type: "spring" as const,
  stiffness: 220,
  damping: 24,
};

/** Gentle entry for page-level transitions */
export const SPRING_PAGE = {
  type: "spring" as const,
  stiffness: 200,
  damping: 26,
};
