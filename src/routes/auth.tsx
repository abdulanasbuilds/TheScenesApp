import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { z } from "zod";
import { useAppStore } from "@/lib/app-store";

const searchSchema = z.object({ mode: z.enum(["signup", "signin"]).catch("signup") });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or sign up · SukaSpace" },
      { name: "description", content: "Join SukaSpace to launch or join a premium learning community." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const nav = useNavigate();
  const store = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    if (mode === "signup") {
      if (!name.trim()) { setError("Enter your name to create an account."); return; }
      const result = store.signUp(name.trim(), email.trim(), password, "learner");
      if (result === "email_taken") {
        setError("An account with that email already exists. Sign in instead.");
        return;
      }
      nav({ to: "/onboarding" });
    } else {
      const result = store.signIn(email.trim(), password);
      if (result === "not_found") {
        setError("No account found for that email. Sign up to get started.");
        return;
      }
      if (result === "wrong_password") {
        setError("Incorrect password. Please try again.");
        return;
      }
      nav({ to: "/app/feed" });
    }
  };

  const toggleMode = () => {
    setError(null);
    setForgotMode(false);
    setMode((m) => (m === "signup" ? "signin" : "signup"));
  };

  if (forgotMode) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 pb-24">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-100 bg-card p-8">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white">S</span>
              <span className="text-base font-extrabold tracking-tighter text-foreground">SUKASPACE</span>
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tighter text-[#151515]">Reset password</h1>
            <p className="mt-2 text-sm text-muted-foreground">Password recovery is not yet available in this early access version.</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-muted-foreground">
            If you've forgotten your password, please create a new account or contact support. Full password recovery will be available in a future release.
          </div>
          <button
            onClick={() => setForgotMode(false)}
            className="mt-6 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Back to sign in
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 pb-24">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white">S</span>
            <span className="text-base font-semibold text-foreground">SUKASPACE</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-primary">SUKASPACE</h1>
          <p className="mt-2 text-sm text-muted-foreground">{mode === "signup" ? "Create your professional workspace" : "Sign in to your professional workspace"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <label className="block text-xs font-semibold text-foreground mb-2">Full name</label>
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
            <label className="block text-xs font-semibold text-foreground mb-2">Email Address</label>
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
                <button type="button" onClick={() => setForgotMode(true)} className="text-xs font-semibold text-primary hover:underline">Forgot password?</button>
              )}
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            type="submit"
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {mode === "signup" ? "Create account" : "Sign In"}
          </motion.button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">Or continue with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          disabled
          title="Google sign-in coming soon"
          className="mt-6 w-full cursor-not-allowed rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-muted-foreground opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google · Coming soon
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? (
            <>Already have an account? <button type="button" onClick={toggleMode} className="font-semibold text-primary hover:underline">Sign In</button></>
          ) : (
            <>Don&apos;t have an account? <button type="button" onClick={toggleMode} className="font-semibold text-primary hover:underline">Sign Up</button></>
          )}
        </p>
      </div>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-slate-100/50 px-4 py-4">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">SUKASPACE</span>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">Privacy</Link>
          <Link to="/about" className="hover:text-foreground">Terms</Link>
          <Link to="/about" className="hover:text-foreground">Support</Link>
        </div>
        <span className="text-xs text-muted-foreground">© 2026 SUKASPACE. Intellectual Clarity.</span>
      </div>
    </div>
  );
}
