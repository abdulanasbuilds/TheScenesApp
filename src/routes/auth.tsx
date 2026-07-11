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
          <svg className="h-4 w-4" viewBox="0 0 24 24"><image href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ctext x='0' y='16' fontSize='16'%3EG%3C/text%3E%3C/svg%3E" /></svg>
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

