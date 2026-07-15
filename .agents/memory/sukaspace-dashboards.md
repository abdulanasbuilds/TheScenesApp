---
name: SukaSpace Dashboards & Auth
description: Routing, auth guard, role-based navigation, Paystack integration, and Coming Soon routes.
---

## Auth
- Auth guard is in `AppShell.tsx` via `window.location.replace("/auth")` when `!store.session`.
- Role-based redirect post-login: creator → `/app/creator`, learner → `/app/dashboard`.
- `create-community` route has its own auth guard.

## Navigation
- `CREATOR_NAV` and `LEARNER_NAV` are typed `NavItem[]` arrays (not `as const`) with optional `comingSoon?: boolean`.
- Nav items with `comingSoon: true` show an amber "Soon" badge in both desktop sidebar and mobile scrollable nav.
- Mobile bottom nav shows only top 5 routes (no coming-soon items).
- Mobile scrollable nav (horizontal scroll below top bar) shows ALL nav items including coming-soon.
- XP tier badge shown in sidebar above profile card; uses `xpToTier(0)` placeholder — wire real XP when tracking is implemented.

## Key routes
- `/app/dashboard` — Learner dashboard (5 tabs)
- `/app/creator` — Creator Hub (7 tabs)
- `/app/leaderboard` — Full leaderboard with podium, rankings table, achievements, tier progression
- `/app/payouts` — Payouts with Paystack connection banner, earnings chart, withdrawal modal
- `/app/live` — Coming Soon (Radio icon, rose gradient)
- `/app/automations` — Coming Soon (Zap icon, amber gradient), creator-only nav
- `/app/affiliate` — Coming Soon (Share2 icon, emerald gradient), creator-only nav

## Paystack Integration
- `src/lib/paystack.ts` — client-side SDK loader, `initiatePaystackPayment()`, `isPaystackConfigured()`, `priceStringToAmount()`
- `src/lib/paystack.functions.ts` — server-side `verifyPaystackPayment` createServerFn; calls `https://api.paystack.co/transaction/verify/{ref}`
- Public key: `VITE_PAYSTACK_PUBLIC_KEY` (client-safe); Secret key: `PAYSTACK_SECRET_KEY` (server only).
- When Paystack is NOT configured, discover page shows "Demo Mode" — joins community without real payment (graceful fallback).
- Verify flow: popup callback → call `verifyPaystackPayment` server fn → on success call `store.joinCommunity(id)`.
- **Why:** Paystack chosen over Flutterwave (simpler popup API); Stripe = "Coming Soon" note in UI.

## Replit PostgreSQL schema
- 7 tables created from `MIGRATION_SQL` in `src/lib/db.ts`.
- App functions fully in localStorage-only mode (Supabase keys absent — intentional).

## Coming Soon component
- `src/components/ComingSoon.tsx` — accepts `icon`, `title`, `subtitle`, `description`, `features[]`, `badge`, `backTo`, `backLabel`, `gradientClass`.
- "Notify me" button calls `store.pushNotification()` + toast (no email).

## xpToTier function
- Updated to return `{ name, color, emoji, nextAt: number | null }`.
- Tiers: Bronze (0) → Silver (500) → Gold I (900) → Gold II (1400) → Platinum (2000) → Diamond I (2800) → Diamond Elite (4000).
- **Why:** Added `nextAt` for progress bar rendering in leaderboard and sidebar.

## Mock data additions
- `MOCK_LEADERBOARD_MEMBERS` — 10 members with `xp`, `weekXp`, `monthXp`, `streak`, `postsCount`, `coursesCompleted`.
- `MOCK_TESTIMONIALS` — 3 testimonials used on landing page.
- `XP_EVENTS` — XP rewards table for different actions.

## Landing page (index.tsx)
- Sections: Hero → Stats bar → Core features (8) → How it works (3 steps) → Comparison table vs Skool/Circle → Coming Soon strip → Testimonials → Pricing teaser → Final CTA → Footer.
- `CellVal = boolean | "soon"` type used for comparison table cells.
- Avatar `tone` valid values: `"slate" | "primary" | "sky"` (NOT "default").
