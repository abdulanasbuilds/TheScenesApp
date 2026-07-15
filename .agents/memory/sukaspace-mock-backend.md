---
name: SukaSpace data layer
description: How SukaSpace persists data — Supabase-backed with a localStorage fallback — and the auth-guard quirk in AppShell.
---

## Persistence model
`src/lib/app-store.tsx` is a React context (`AppStoreProvider`/`useAppStore`) that is the single source of truth for all app data (communities, courses/modules/lessons, feed posts/comments/reactions, enrollments, notifications, etc.).

- If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, it hydrates from and persists to the user's own Supabase project (schema in `supabase/schema.sql`, run manually in their Supabase SQL editor — this is the user's own external tool, not a Replit-managed connector).
- If those env vars are absent, it silently falls back to the original localStorage-only store (key: `sukaspace_app_state_v3`) so the app never breaks — just doesn't persist across browsers/devices.
- Mutations are optimistic: local React state updates immediately, then a matching Supabase write fires in the background (`sync()` helper) and toasts on failure without rolling back the UI.
- Auth switched from a plaintext-password local `accounts` array to real `supabase.auth` (email/password) plus a `profiles` table, only when Supabase is configured. `signIn`/`signUp` are now `async` — call sites must `await` them (see `src/routes/auth.tsx`).

**Why:** user explicitly wants to use their own Supabase project (not Replit-managed Postgres) as the real backend, but declined to hand over credentials during this session, so the code needed to work correctly in both states without crashing.

**How to apply:** when adding new persisted entities, add a table to `supabase/schema.sql`, a row-mapper pair in `app-store.tsx`, and wire the same optimistic-update-then-`sync()` pattern. Don't assume Supabase is configured — always guard with `if (supabase) sync(...)`.

## Auth guard quirk
`AppShell.tsx`'s auth guard uses `window.location.replace("/auth")`, not the router's `navigate()` — keep that if touching auth redirects.

## Rebrand / de-Lovabling (completed)
Cloudflare is the user's deploy target — `vite.config.ts`'s nitro preset must stay `cloudflare-module`. All `@lovable.dev/*` packages and branding were removed; the app is now genuinely a Vite app with no Lovable dependency.
