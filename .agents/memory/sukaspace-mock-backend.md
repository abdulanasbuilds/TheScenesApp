---
name: SukaSpace client-only data layer
description: No real backend for app data; localStorage store. Auth guard quirk. De-lovabled build config.
---

- No real backend for app data: a localStorage-backed store (key `sukaspace_app_state_v3`) is the entire persistence layer for communities/courses/etc.
- `AppShell`'s auth guard uses `window.location.replace("/auth")`, not TanStack Router's `navigate()` — intentional, don't "fix" it to use `navigate()` without checking why (likely to force a full remount past router state).
- Project was imported from Lovable. All `@lovable.dev/*` packages, the sandbox-only Vite config wrapper, the Lovable error reporter, and the AGENTS.md Lovable banner were removed — `vite.config.ts` is now a plain `defineConfig` (nitro build preset set to `node-server`, not the old `cloudflare-module` default, since this runs on Replit/Node not Cloudflare). Brand mark lives in `src/components/Logo.tsx` (`src/assets/logo-icon.png` / `logo-full.png`) — use it instead of hand-rolled "S" badges or text wordmarks.
- Real persistence (Replit Postgres, 7 tables, `pg` installed) was set up in an earlier session but the app UI still only reads/writes localStorage — the DB isn't wired into the app yet (tracked as a separate proposed task).
