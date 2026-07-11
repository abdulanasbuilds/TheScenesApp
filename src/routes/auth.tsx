import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { z } from "zod";

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
  const nav = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white">S</span>
            <span className="text-base font-semibold text-foreground">SUKASPACE</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-primary">SUKASPACE</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your professional workspace</p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/app/feed" }); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Email Address</label>
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-foreground">Password</label>
              <button type="button" className="text-xs font-semibold text-primary hover:underline">Forgot password?</button>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            type="submit"
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Sign In
          </motion.button>
        </form>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">Or continue with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Google Button */}
        <button type="button" className="mt-6 w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-slate-50 focus:outline-none flex items-center justify-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        {/* Signup Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account? <button type="button" className="font-semibold text-primary hover:underline">Sign Up</button>
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-slate-100/50 px-4 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">SUKASPACE</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <button className="hover:text-foreground">Privacy</button>
            <button className="hover:text-foreground">Terms</button>
            <button className="hover:text-foreground">Support</button>
          </div>
          <span className="text-xs text-muted-foreground">© 2024 SUKASPACE. Intellectual Clarity.</span>
        </div>
      </div>
    </div>
  );
}

