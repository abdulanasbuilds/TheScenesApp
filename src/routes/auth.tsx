import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { z } from "zod";
import { GraduationCap, Rocket } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { Logo } from "@/components/Logo";
import { hapticTap, hapticError, SPRING_FAST, SPRING_PAGE } from "@/lib/pwa";

const searchSchema = z.object({ mode: z.enum(["signup", "signin"]).catch("signup") });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or sign up · SukaSpace" },
      {
        name: "description",
        content: "Join SukaSpace to launch or join a premium learning community.",
      },
    ],
  }),
  component: Auth,
});

type Role = "learner" | "creator";

// Background prefetch: warm the store cache while user types credentials
function useBackgroundPrefetch(email: string) {
  const store = useAppStore();
  const triggered = useRef(false);

  useEffect(() => {
    // Fire once the user has entered a valid-looking email
    if (triggered.current) return;
    if (!email.includes("@") || email.length < 5) return;

    triggered.current = true;

    // Trigger localStorage hydration (already happens on mount, but
    // calling this ensures the store is fully ready before we navigate)
    if (store.isHydrated) return;

    // Pre-warm any images the dashboard will need
    const topImages = ["/favicon-256.png", "/apple-touch-icon.png"];
    topImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [email, store.isHydrated]);
}

function Auth() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [role, setRole] = useState<Role>("learner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const nav = useNavigate();
  const store = useAppStore();

  // Background preload while user types
  useBackgroundPrefetch(email);

  useEffect(() => {
    if (store.isHydrated && store.session) {
      const dest = store.session.role === "creator" ? "/app/creator" : "/app/dashboard";
      window.location.replace(dest);
    }
  }, [store.isHydrated, store.session]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes("@")) {
      hapticError();
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      hapticError();
      setError("Password must be at least 6 characters.");
      return;
    }

    hapticTap();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          hapticError();
          setError("Enter your name to create an account.");
          return;
        }
        const result = await store.signUp(name.trim(), email.trim(), password, role);
        if (result === "email_taken") {
          hapticError();
          setError("An account with that email already exists. Sign in instead.");
          return;
        }

        // Handle case where email confirmation is required by your Supabase settings
        if (!store.session) {
          setError("Account created! Please check your email inbox to confirm your account before logging in.");
          setSubmitting(false);
          return;
        }

        // ── Instant provisioning: skip onboarding, route straight to feed ──
        // Profile picture and bio can be set later in Settings.
        const dest = role === "creator" ? "/app/creator" : "/app/dashboard";
        nav({ to: dest });
      } else {
        const result = await store.signIn(email.trim(), password);
        if (result === "not_found") {
          hapticError();
          setError("No account found for that email. Sign up to get started.");
          return;
        }
        if (result === "wrong_password") {
          hapticError();
          setError("Incorrect email or password. Please try again.");
          return;
        }
        const dest = result.role === "creator" ? "/app/creator" : "/app/dashboard";
        nav({ to: dest });
      }
    } catch {
      hapticError();
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    hapticTap();
    setError(null);
    setForgotMode(false);
    setMode((m) => (m === "signup" ? "signin" : "signup"));
  };

  if (forgotMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_PAGE}
        className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 pb-24"
      >
        <div className="w-full max-w-sm rounded-2xl border border-neutral-100 bg-card p-8">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
              <Logo className="h-7 w-auto" />
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tighter text-[#151515]">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Password recovery is not yet available in this early access version.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-muted-foreground">
            If you've forgotten your password, please create a new account or contact support.
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={SPRING_FAST}
            onClick={() => {
              hapticTap();
              setForgotMode(false);
            }}
            className="mt-6 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Back to sign in
          </motion.button>
        </div>
        <Footer />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_PAGE}
      className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 pb-24"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <Logo className="h-7 w-auto" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-primary">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Join your professional learning community"
              : "Sign in to your workspace"}
          </p>
        </div>

        {/* Role selector — only on signup */}
        <AnimatePresence>
          {mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5"
            >
              <p className="mb-2 text-xs font-semibold text-foreground">I want to…</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("learner")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-left transition ${
                    role === "learner"
                      ? "border-primary bg-sky-50"
                      : "border-border bg-card hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-lg ${role === "learner" ? "bg-primary/10 text-primary" : "bg-slate-100 text-muted-foreground"}`}
                  >
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Learn</div>
                    <div className="text-[10px] text-muted-foreground">Join communities</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("creator")}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-left transition ${
                    role === "creator"
                      ? "border-primary bg-sky-50"
                      : "border-border bg-card hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-lg ${role === "creator" ? "bg-primary/10 text-primary" : "bg-slate-100 text-muted-foreground"}`}
                  >
                    <Rocket size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Create</div>
                    <div className="text-[10px] text-muted-foreground">Build &amp; teach</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Full name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Email Address
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-foreground">Password</label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
          >
            {submitting
              ? "Please wait…"
              : mode === "signup"
                ? `Create ${role === "creator" ? "creator" : "learner"} account`
                : "Sign In"}
          </motion.button>
        </form>


        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-primary hover:underline"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-primary hover:underline"
              >
                Sign Up
              </button>
            </>
          )}
        </p>
      </div>

      <Footer />
    </motion.div>
  );
}

function Footer() {
  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-slate-100/50 px-4 py-4">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">SUKASPACE</span>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/about" className="hover:text-foreground">
            Terms
          </Link>
          <Link to="/about" className="hover:text-foreground">
            Support
          </Link>
        </div>
        <span className="text-xs text-muted-foreground">
          © 2026 SUKASPACE. Intellectual Clarity.
        </span>
      </div>
    </div>
  );
}
