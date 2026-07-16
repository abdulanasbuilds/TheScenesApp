---
name: SukaSpace Realtime, DMs, Drip, Payments, Email
description: Architecture decisions for the five priority items implemented — Paystack paid joins, Supabase Realtime, Resend email, DMs, and drip/locked content.
---

## Paystack PAID community joins
- `joinPaidCommunity(communityId, onError?)` in app-store handles both FREE and PAID.
- For FREE (or Paystack not configured): calls setState directly and syncs to Supabase.
- For PAID: calls `initiatePaystackPayment` → on success: `verifyPaystackPayment` (server fn) → `recordPayment` (server fn, writes to `payments` table) → setState → emails.
- `discover.tsx` `handleJoin` is now `async` and always calls `joinPaidCommunity` (not `joinCommunity` directly).
- `recordPayment` in `src/lib/payments.functions.ts` uses `SUPABASE_SERVICE_KEY` (NOT the anon key) to bypass RLS on insert. Silently succeeds even if key is missing (payment already verified by Paystack).

## Supabase Realtime
- `setupRealtime(email)` is called inside `bootFromSupabase` after initial data load.
- Channel name: `sukaspace-live`; subscribes to INSERT on `posts`, `notifications` (filtered by user email), and `direct_messages` (filtered by to_email).
- Realtime channel ref stored in `realtimeChannelRef` (useRef) — cleaned up on auth state change and on useEffect cleanup.
- `alter publication supabase_realtime add table posts/notifications/direct_messages` must be run in Supabase dashboard for realtime to work (schema.sql has a comment for this).

## Direct Messages (DMs)
- `DirectMessage` type: id, fromEmail, toEmail, body, read, createdAt (all bigint/number timestamps).
- State: `directMessages: DirectMessage[]` in PersistedState; loaded in bootFromSupabase with `.or()` filter for both from/to.
- Actions: `sendDM(toEmail, body)`, `getConversations()` (derived), `getMessagesWithUser(peerEmail)`, `markDMsRead(fromEmail)`, `dmUnreadCount`.
- `app.messages.tsx` is a full two-panel DM inbox with New message dialog.
- Shows "Supabase required" empty state when `isSupabaseConfigured` is false.

## Resend Email
- `src/lib/email.functions.ts` — four TanStack server functions: `sendWelcomeEmail`, `sendEnrollmentEmail`, `sendCommunityJoinEmail`, `sendPaymentReceiptEmail`.
- All fire-and-forget (`.catch(() => {})`) — never blocks the user action.
- Env vars needed: `RESEND_API_KEY` (server-only), `RESEND_FROM_EMAIL` (optional, defaults to `noreply@sukaspace.com`).
- Called from: `signUp` (welcome), `enrollInCourse` (enrollment), `joinCommunity`/`joinPaidCommunity` (community join + receipt for PAID).

## Drip / Locked Content
- `Lesson` type has `dripDays: number` (0 = no drip / available immediately).
- `isLessonUnlocked(courseId, lessonId)` checks enrollment date + dripDays * 86400000 against Date.now().
- `app.classroom.tsx` sidebar shows lock icon + days remaining for locked lessons; main player shows a locked content panel.
- `app.courses.tsx` LessonEditor has a "Drip schedule" number input that saves `dripDays`.
- Supabase: `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS drip_days int not null default 0` — included in schema.sql.

## New Supabase tables (schema.sql)
- `direct_messages` — RLS: participants can read, sender can insert, recipient can update (mark read).
- `payments` — RLS: participants can read, authenticated can insert.
- `SUPABASE_SERVICE_KEY` env var needed for payments server fn to write with elevated privileges.

**Why:** Paystack verification must happen server-side (secret key). Realtime uses postgres_changes which requires the tables added to the realtime publication. DMs use Supabase as source of truth (no localStorage fallback for DMs — they only appear when Supabase is configured).
