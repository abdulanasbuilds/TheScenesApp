import { useEffect, useState } from "react";
import { Download, RefreshCw, Share, X } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * PWA install and update experience (P4-S5).
 *
 * Everything here is user-initiated and dismissible:
 * - install guidance appears only when the browser offers an install prompt (or when running on iOS,
 *   which has no `beforeinstallprompt` event and needs "Add to Home Screen" guidance);
 * - a service-worker update is announced and applied only when the user chooses to reload.
 *
 * Registration of the service worker is limited to production builds so development and the fixture
 * verification suite are never served from a stale cache.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "thescenes.pwa.install-dismissed";

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export function PwaExperience() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [iosGuidance, setIosGuidance] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    const standalone = isStandalone();

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      if (!dismissed && !standalone) setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS Safari never fires `beforeinstallprompt`, so offer explicit guidance once. Deferred so the
    // server-rendered markup is not replaced during the first client render.
    const iosTimer = window.setTimeout(() => {
      if (cancelled) return;
      if (isIosDevice() && !standalone && !dismissed) {
        setIosGuidance(true);
        setShowInstall(true);
      }
    }, 0);

    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registered) => {
          if (registered.waiting) {
            setWaitingWorker(registered.waiting);
            setUpdateReady(true);
          }
          registered.addEventListener("updatefound", () => {
            const installing = registered.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(registered.waiting ?? installing);
                setUpdateReady(true);
              }
            });
          });
        })
        .catch(() => {
          // A failed registration is not fatal; the application runs as an ordinary web page.
        });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(iosTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const dismiss = () => {
    setShowInstall(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage can be unavailable (private mode); the banner simply reappears next session.
    }
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstall(false);
    if (choice.outcome === "dismissed") dismiss();
  };

  const applyUpdate = () => {
    if (!waitingWorker) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
      once: true,
    });
    waitingWorker.postMessage("SKIP_WAITING");
    setUpdateReady(false);
  };

  if (!showInstall && !updateReady) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-96">
      {updateReady ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        >
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">A new version is ready</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Reload to update The Scenes. Your unsaved input may be lost.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={applyUpdate}>
                Reload
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setUpdateReady(false)}>
                Later
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showInstall ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        >
          <Download className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Install The Scenes</p>
            {iosGuidance ? (
              <p className="mt-0.5 text-xs text-slate-600">
                Tap <Share className="inline h-3 w-3 align-text-bottom" aria-hidden="true" /> Share,
                then <span className="font-semibold">Add to Home Screen</span> to install.
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-600">
                Add The Scenes to your home screen for faster, full-screen access. On a slow
                connection, the shell still opens offline.
              </p>
            )}
            <div className="mt-3 flex gap-2">
              {iosGuidance ? null : (
                <Button size="sm" onClick={() => void install()}>
                  Install
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={dismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
