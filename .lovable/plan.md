# Skool-parity ship plan

You picked all four slices with "Additive + refactor." That's ~20 features touching the store, wizards, dashboards, and DB. To ship without breaking existing flows I'll execute in four sequenced phases, each self-contained and independently deployable. After each phase I'll run `bun run build` + a Playwright audit before moving on.

## Phase 1 — Community creation parity (create-community + about page)

- Extend `Community` in `src/lib/app-store.tsx`:
  - `iconUrl` (128×128), `coverImageUrl` (1084×576), `brandColor` (hex), `isPrivate`, `discoveryKeywords: string[]` (max 11), `screeningQuestions: string[]` (max 3), `aboutMedia`, `aboutBody`.
- Refactor `src/routes/create-community.tsx` into a 5-step Skool-style wizard: Basics → Branding (icon+cover+brand color) → Privacy & Discovery (keywords + private/public) → Screening (0–3 questions) → Pricing (see Phase 4).
- New `src/routes/c.$slug.about.tsx` public preview page (non-members) rendering cover, description, screening questions, join CTA.
- Join flow updates: if community has screening questions, show a modal to answer before `store.joinCommunity`.
- Migration `supabase/community-parity.sql`: new columns + GRANTs + RLS.

## Phase 2 — Course/classroom parity

- Extend `Course`/`CourseModule` in store: `coverImageUrl` (1460×752), `folders: {id,title,lessonIds[]}[]`, `dripDaysFromJoin`, `requiredLevel` (level-gate), `courseKey` (uuid, for import), `videoUploadUrl` (native-hosted URL string field, no actual host).
- Refactor `src/routes/app.courses.tsx` builder:
  - Cover image uploader with size hint.
  - Drag folder tree for lesson organization.
  - Per-lesson drip-days input.
  - Per-course "Requires Level N" gate.
  - "Import course by key" input → clones a course by `courseKey`.
- Classroom viewer (`src/routes/app.classroom.tsx`): respect drip lock + level lock; show unlock reason.
- Migration extends `courses` and `course_modules`.

## Phase 3 — Engagement + anti-spam

- Store additions: `pinnedPostId` per community, `requiredLevelToPost` per community, `lastBroadcastAt` per community, `emailReminderEnabled` per event.
- `src/routes/app.feed.tsx`: pinned post rendered at top with "Start Here" badge + required-action checklist state per user.
- Composer disabled with tooltip when `user.level < community.requiredLevelToPost`.
- Creator Hub → Settings tab: "Require Level N to post" + "Pin post" selector + "Broadcast to email" button (client-side 72h throttle via `lastBroadcastAt`).
- `src/routes/app.calendar.tsx`: recurring rule (weekly/monthly) + "Email reminder 1 day before" toggle.
- Server fn `sendBroadcastEmail` in `src/lib/email.functions.ts` (Resend, throttled server-side too).

## Phase 4 — Monetization + analytics parity

- Pricing model refactor in `src/lib/plans.ts` + create-community: `Free | Subscription | Freemium | Tiered | OneTime`. Tiered = array of `{name, price, interval}`.
- Store: `community.pricingModel`, `community.tiers[]`, `community.oneTimePrice`.
- Creator Hub Overview: add MRR, retention %, page-visitor count, conversion % tiles wired to real store aggregates (deterministic from members + payments, not `Math.random`).
- Settings tab: Meta Pixel ID + Google Analytics ID inputs; injected via `<script>` in `__root.tsx` when set (per-community fires only on that community's pages).
- Payouts page already exists — add "Payout frequency" selector (Weekly/Monthly).

## Technical guardrails

- No breaking rename of existing fields — all new fields optional with sensible defaults.
- Every store method keeps its old signature; new params are optional/overloaded like existing `pushNotification`.
- Every new DB column ships with `GRANT` + RLS in its migration.
- `bun run build` + `tsgo` + Playwright 27-route audit after each phase.
- No new external deps; reuse `motion`, `lucide-react`, `zod`.
- Public routes stay untouched (per memory rule): `index`, `discover`, `creators`, `learners`, `pricing`, `auth` — only additions are the new `c.$slug.about.tsx` and inline elements the user explicitly asked for.

## Deliverable order per turn

Turn A (next): Phase 1 end-to-end (store + wizard + about page + migration + build/audit).
Turn B: Phase 2.
Turn C: Phase 3.
Turn D: Phase 4 + final full-audit + publish handoff.

Approve to start Turn A, or tell me to reorder / drop a phase.
