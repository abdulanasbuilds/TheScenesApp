---
name: SukaSpace dashboards + auth + rich text
description: Learner dashboard, Creator Hub tabs, auth guard, Paystack, rich text editor, affiliate system
---

## Routing

- Learner dashboard: `/app/dashboard`
- Creator Hub: `/app/creator` — 10 tabs: overview, communities, courses, members, payments, analytics, **affiliate**, **live** (Soon), **automations** (Soon), settings
- Affiliate management: `/app/affiliate` — standalone functional page (creator-set commission)
- Auth: `/auth`
- 3 Coming Soon standalone routes still exist: `/app/live`, `/app/automations` (coming soon pages), `/app/affiliate` (now functional)
- Role-based routing post-login based on `store.session.role` ("creator" → `/app/creator`, "learner" → `/app/dashboard`)

## Auth guard

- `AppShell.tsx` uses `window.location.replace("/auth")` (not `useNavigate()`) for unauthenticated redirect

## Public pages — DO NOT CHANGE without explicit request

- `index.tsx`, `discover.tsx`, `creators.tsx`, `learners.tsx`, `pricing.tsx`, `auth.tsx` — all match the reference design at https://sukaspace.abdulanas.workers.dev/
- `index.tsx` and `discover.tsx` were previously redesigned without user request and then restored via `git checkout 89ad359`

## Rich Text Editor

- `src/components/RichTextEditor.tsx` — custom contentEditable + execCommand, no external deps
- Props: `value`, `onChange`, `placeholder`, `minHeight`, `className`, `autoFocus`
- `stripHtml(html)` utility exported for plain-text length checks
- Used in: `app.feed.tsx` (PostComposer), `app.courses.tsx` (lesson description), `app.classroom.tsx` (renders HTML via dangerouslySetInnerHTML)
- HTML rendering classes pattern: `[&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_blockquote]:border-l-2 [&_pre]:bg-accent ...` (Tailwind v4 arbitrary variants, no @tailwindcss/typography needed)

## Affiliate system

- Creator-managed: creator sets commission rate (5–50%), type (recurring | one-time), cookie days (30/60/90)
- Settings stored in localStorage key: `sukaspace_aff_${communityId}` (JSON)
- Referral link format: `${window.location.origin}/ref/${referralCode}`
- Referral code generated via: slug + random alphanumeric (makeCode function)
- Mock affiliates table shown when enabled (MOCK_AFFILIATES in both creator.tsx and affiliate.tsx)
- Full management page at `/app/affiliate`; also accessible as "Affiliate" tab in Creator Hub

## Creator Hub (app.creator.tsx)

- OverviewTab: uses MOCK_GROWTH_SERIES (from mock-data.ts) for real AreaChart, no Math.random()
- Quick action "Affiliate program" → navigates to `/app/affiliate` (not setTab)
- PaymentsTab: links to `/app/payouts` for full payout dashboard
- LiveTab / AutomationsTab: coming-soon sections with feature previews + notify-me buttons

## Paystack

- `isPaystackConfigured()` from `@/lib/paystack` — checks env var
- `initiatePaystackPayment()` — popup API
- Server fn: `verifyPaystackPayment` in `paystack.functions.ts`

## Gamification

- `xpToTier(xp)` returns `{ name, color, emoji, nextAt: number | null }` — tiers Bronze → Silver → Gold I → Gold II → Platinum → Diamond I → Diamond Elite
- Avatar tone valid values: `"slate" | "primary" | "sky"` only

## App store

- localStorage key: `sukaspace_app_state_v3`
- Key methods: `store.pushNotification()`, `store.isJoined(id)`, `store.markAllNotificationsRead()`, `store.unreadCount`, `store.joinCommunity(id)`, `store.addPost()`
- Community type fields: `id`, `title`, `category`, `members`, `creator`, `creatorEmail`, `avatar`, `banner`, `tag`, `price?`, `summary`, `createdAt`
