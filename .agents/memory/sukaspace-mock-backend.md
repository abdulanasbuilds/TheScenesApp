---
name: SukaSpace client data layer
description: How state, types, and Supabase sync are wired in app-store.tsx; key type additions over time.
---

# SukaSpace data layer

## Core pattern

- `app-store.tsx` is the single source of truth; state starts in `localStorage` (key `sukaspace_app_state_v3`) and is synced to Supabase optimistically in the background via `sync()`.
- Row IDs are client-generated `Date.now()` numbers — **BIGINT** in Supabase (not SERIAL), so they always match.
- `communityToRow` / `communityFromRow` / `courseToRow` / `courseFromRow` are the mapping functions.

## Auth — REAL Supabase Auth (not custom)

- `supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.getSession` — real JWT-based auth.
- Falls back to localStorage accounts when Supabase is not configured.
- `fetchProfile(userId, email, meta)` reads/upserts `profiles` table on first sign-in.
- RLS policies use `auth.email()` and `auth.uid()` — work correctly once schema is applied.

## Community type (as of 2026-07-17)

Fields: `id, title, category, members, creator, creatorEmail, avatar, banner, tag, price, summary, createdAt`

- **new**: `color?: string` (hex brand color), `coverImageUrl?: string`, `isPrivate?: boolean`
  Mapped to: `color`, `cover_image_url`, `is_private` columns.

## Course type (as of 2026-07-17)

Fields: `id, communityId, title, description, creatorEmail, modules, published, enrollmentCount, createdAt`

- **new**: `coverImageUrl?: string`, `thumbnail?: string` (gradient-class fallback)

## Supabase schema

The canonical schema is in `src/supabase/schema.sql` — idempotent, run in Supabase SQL Editor.
Includes: `feedback` table (anon INSERT allowed), all 18 app tables with RLS + 20+ indexes.

## Table names (must match app-store queries)

`communities`, `joined_communities`, `posts`, `liked_posts`, `comments`, `reactions`,
`direct_messages`, `courses`, `modules` (NOT course_modules), `lessons`, `lesson_resources`,
`enrollments` (with `completed_lesson_ids` BIGINT[] column),
`community_resources`, `community_events`, `access_records`, `notifications`, `payments`, `profiles`, `feedback`

## Realtime subscriptions (setupRealtime)

INSERT: posts, communities, notifications (filtered), direct_messages (filtered)
DELETE: communities, posts, courses, notifications, direct_messages
UPDATE: profiles (filtered to current user)

## Feedback form

`src/lib/feedback.functions.ts` — server fn writes to Supabase `feedback` table via REST API first, then optionally notifies via Telegram. Never throws — always returns success.
Keys needed: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_PRIVATE_CHAT_ID` (optional, for Telegram notifications).

## Cloudflare env var architecture (CRITICAL)

Two distinct classes — never mix them:

- **Build-time (VITE\_ prefix)**: baked into client JS bundle by Vite. `import.meta.env.VITE_*`. Set in Cloudflare as build Environment Variables.
  → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PAYSTACK_PUBLIC_KEY`, `VITE_APP_URL`
- **Runtime (no prefix)**: Cloudflare Worker bindings, available as `process.env.*` in server functions via Nitro polyfill. Set in Cloudflare as Secrets.
  → `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_PRIVATE_CHAT_ID`

**Why**: `process.env.VITE_*` does NOT work at runtime on Cloudflare Workers — Vite replaces `import.meta.env.VITE_*` at build time but does NOT expose them as Worker runtime bindings. Server functions must use non-VITE names.
**How to apply**: Every new server function (`createServerFn`) must ONLY use non-VITE `process.env.*`. Client code uses `import.meta.env.VITE_*`. See `.env.example` and `CLOUDFLARE_SETUP.md`.
