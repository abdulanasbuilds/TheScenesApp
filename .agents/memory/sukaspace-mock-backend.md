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
+ **new**: `color?: string` (hex brand color), `coverImageUrl?: string`, `isPrivate?: boolean`
Mapped to: `color`, `cover_image_url`, `is_private` columns.

## Course type (as of 2026-07-17)
Fields: `id, communityId, title, description, creatorEmail, modules, published, enrollmentCount, createdAt`
+ **new**: `coverImageUrl?: string`, `thumbnail?: string` (gradient-class fallback)

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
