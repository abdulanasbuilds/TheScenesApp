---
name: SukaSpace client data layer
description: How state, types, and Supabase sync are wired in app-store.tsx; key type additions over time.
---

# SukaSpace data layer

## Core pattern
- `app-store.tsx` is the single source of truth; state starts in `localStorage` (key `sukaspace_app_state_v3`) and is synced to Supabase optimistically in the background via `sync()`.
- Row IDs are client-generated `Date.now()` numbers — **BIGINT** in Supabase (not SERIAL), so they always match.
- `communityToRow` / `communityFromRow` / `courseToRow` / `courseFromRow` are the mapping functions.

## AppShell auth guard
Uses `window.location.replace("/auth")` not `nav()` to prevent history stacking.

## Community type (as of 2026-07-17)
Fields: `id, title, category, members, creator, creatorEmail, avatar, banner, tag, price, summary, createdAt`
+ **new**: `color?: string` (hex brand color, e.g. `#3B82F6`), `coverImageUrl?: string`, `isPrivate?: boolean`

Mapped to: `color`, `cover_image_url`, `is_private` columns in `communities` table.

## Course type (as of 2026-07-17)
Fields: `id, communityId, title, description, creatorEmail, modules, published, enrollmentCount, createdAt`
+ **new**: `coverImageUrl?: string`, `thumbnail?: string` (gradient-class fallback like `"from-blue-500 to-violet-600"`)

Mapped to: `cover_image_url`, `thumbnail` columns in `courses` table.

## Supabase schema
The canonical schema is in `src/supabase/schema.sql` — idempotent, run in Supabase SQL Editor.
`db.ts` holds the TypeScript types and points to the schema file; MIGRATION_SQL has been removed from db.ts.

## Table names (must match app-store queries)
`communities`, `joined_communities`, `posts`, `liked_posts`, `comments`, `reactions`,
`direct_messages`, `courses`, `modules` (NOT course_modules), `lessons`, `lesson_resources`,
`enrollments` (with `completed_lesson_ids` BIGINT[] column),
`community_resources`, `community_events`, `access_records`, `notifications`, `payments`, `profiles`

## RLS + Indexes
All 18 tables have RLS enabled and policies written in schema.sql.
Realtime publication includes: `direct_messages`, `posts`, `notifications`.
