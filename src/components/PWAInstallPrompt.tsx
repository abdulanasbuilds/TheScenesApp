/**
 * PWAInstallPrompt — shown to first-time visitors (logged in or not)
 *
 * Behaviour:
 *  • Appears 4 s after first page load if the user hasn't dismissed it before
 *  • On Android/Chrome: triggers the native "Add to Home Screen" prompt
 *  • On iOS Safari: shows step-by-step instructions (no API available on iOS)
 *  • On desktop: shows the native install prompt if Chrome supports it, else
 *    a brief "available as an app" message
 *  • Dismissed state stored in localStorage — never shown twice
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, X, Smartphone } from "lucide-react";
import { captureInstallPrompt, hasInstallPrompt, triggerInstallPrompt } from "@/lib/pwa";

const DISMISSED_KEY = "the-scenes_pwa_prompt_dismissed";
const SHOW_DELAY_MS = 4000;

type Platform = "ios" | "android" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  // Already installed as PWA (standalone)
  const isStandalone =
    ("standalone" in navigator && (navigator as any).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches;
  if (isStandalone) return "unknown"; // already installed — don't prompt
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "desktop";
}

function wasDismissed(): boolean {
  try {
    return !!localStorage.getItem(DISMISSED_KEY);
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (wasDismissed()) return;
    captureInstallPrompt(); // safe to call multiple times
    const p = detectPlatform();
    if (p === "unknown") return; // already installed or server

    // Delay to avoid jarring the first paint
    const timer = setTimeout(() => {
      setPlatform(p);
      // For Android/desktop, only show if we have the native prompt OR after 10s
      if (p === "ios") {
        setVisible(true);
      } else {
        // Show immediately if native prompt is captured, otherwise wait a bit longer
        if (hasInstallPrompt()) {
          setVisible(true);
        } else {
          // Wait for the event, max 10s total (SHOW_DELAY_MS already elapsed)
          const fallbackTimer = setTimeout(() => {
            if (hasInstallPrompt()) setVisible(true);
          }, 6000);
          const onAvailable = () => {
            setVisible(true);
            clearTimeout(fallbackTimer);
          };
          window.addEventListener("pwa-install-available", onAvailable, { once: true });
          return () => {
            clearTimeout(fallbackTimer);
            window.removeEventListener("pwa-install-available", onAvailable);
          };
        }
      }
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    markDismissed();
  };

  const install = async () => {
    if (platform === "ios") {
      dismiss();
      return;
    }
    setInstalling(true);
    const accepted = await triggerInstallPrompt();
    setInstalling(false);
    if (accepted) markDismissed();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop (mobile only) */}
          <motion.div
            key="pwa-backdrop"
            className="fixed inset-0 z-[90] bg-black/30 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Sheet */}
          <motion.div
            key="pwa-sheet"
            className="fixed bottom-0 left-0 right-0 z-[91] mx-auto max-w-lg rounded-t-3xl border border-neutral-100 bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm sm:rounded-2xl"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            {/* Drag handle (mobile) */}
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-neutral-200 sm:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary shadow-sm">
                  <Smartphone size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Get the The Scenes app</p>
                  <p className="text-xs text-slate-500">Fast, offline-ready, no app store needed</p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            {/* Benefits */}
            <ul className="mt-4 space-y-2">
              {[
                "Instant loading — works offline too",
                "Push notifications for new activity",
                "Full-screen, no browser chrome",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {benefit}
                </li>
              ))}
            </ul>

            {/* iOS instructions */}
            {platform === "ios" && (
              <div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
                <p className="font-semibold">To install on iPhone / iPad:</p>
                <ol className="mt-1.5 space-y-1 list-decimal list-inside">
                  <li>
                    Tap the <Share size={11} className="inline" /> <strong>Share</strong> button in
                    Safari
                  </li>
                  <li>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </li>
                  <li>
                    Tap <strong>Add</strong> — done!
                  </li>
                </ol>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-4 flex gap-2">
              {platform !== "ios" ? (
                <button
                  onClick={install}
                  disabled={installing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  <Download size={15} />
                  {installing ? "Installing…" : "Install app"}
                </button>
              ) : (
                <button
                  onClick={dismiss}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Got it!
                </button>
              )}
              <button
                onClick={dismiss}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
