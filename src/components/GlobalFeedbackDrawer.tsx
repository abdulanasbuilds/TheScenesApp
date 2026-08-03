import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import {
  FEEDBACK_CATEGORIES,
  submitFeedback,
  type FeedbackCategory,
} from "@/lib/feedback.functions";

/**
 * Global feedback entry point. Mount <GlobalFeedbackDrawer /> ONCE near the
 * root of the authenticated app shell. Anything else — a sidebar link, a
 * shake gesture, a keyboard shortcut — can open it from anywhere by calling
 * openFeedbackDrawer(), no prop drilling or context provider required.
 */
type OpenListener = (category?: FeedbackCategory) => void;
let openListener: OpenListener | null = null;

export function openFeedbackDrawer(presetCategory?: FeedbackCategory) {
  openListener?.(presetCategory);
}

const SHEET_SPRING = { type: "spring" as const, stiffness: 380, damping: 34 };

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration API not supported — safe to ignore.
    }
  }
}

export function GlobalFeedbackDrawer() {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("General Feedback");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lastShakeAt = useRef(0);

  const openWith = useCallback((presetCategory?: FeedbackCategory) => {
    if (presetCategory) setCategory(presetCategory);
    vibrate(15);
    setOpen(true);
  }, []);

  // Register this instance as the single global opener.
  useEffect(() => {
    openListener = openWith;
    return () => {
      if (openListener === openWith) openListener = null;
    };
  }, [openWith]);

  // Shake-to-report: a sharp device-motion spike opens the drawer with
  // "Bug Report" pre-selected. Most Android/desktop browsers fire
  // devicemotion without asking; iOS 13+ requires a user gesture to grant
  // motion permission first, so this is a graceful enhancement there, not
  // a hard requirement — the FAB and sidebar link always work.
  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) return;

    const SHAKE_THRESHOLD = 28;
    const COOLDOWN_MS = 3000;

    function handleMotion(event: DeviceMotionEvent) {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.abs(acc.x ?? 0) + Math.abs(acc.y ?? 0) + Math.abs(acc.z ?? 0);
      const now = Date.now();
      if (magnitude > SHAKE_THRESHOLD && now - lastShakeAt.current > COOLDOWN_MS) {
        lastShakeAt.current = now;
        vibrate([20, 40, 20]);
        openWith("Bug Report");
      }
    }

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [openWith]);

  function resetForm() {
    setName("");
    setCategory("General Feedback");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || submitting) return;

    setSubmitting(true);
    try {
      await submitFeedback({
        data: {
          name: name.trim() || undefined,
          category,
          message: trimmedMessage,
          userLabel: store.session ? `${store.session.name} (${store.session.email})` : undefined,
        },
      });
      toast.success("Thank you! Your feedback has been received.");
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* 1. Global sticky FAB — fixed above the layout tree, visible everywhere. */}
      <button
        type="button"
        aria-label="Give feedback"
        onClick={() => openWith()}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur transition-transform hover:scale-105 hover:bg-primary active:scale-95"
      >
        <MessageCircle size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="feedback-backdrop"
              className="fixed inset-0 z-[60] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setOpen(false)}
            />
            <motion.div
              key="feedback-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Send feedback"
              className="fixed inset-x-0 bottom-0 z-[61] mx-auto w-full max-w-lg rounded-t-3xl border border-neutral-100 bg-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={SHEET_SPRING}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) setOpen(false);
              }}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-neutral-200" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Report a bug / give feedback</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-name">Name (optional)</Label>
                  <Input
                    id="feedback-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={100}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="feedback-category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value as FeedbackCategory)}
                    disabled={submitting}
                  >
                    <SelectTrigger id="feedback-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="feedback-message">Message</Label>
                  <Textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={4}
                    maxLength={2000}
                    required
                    disabled={submitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting || !message.trim()}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Submit feedback"
                  )}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
