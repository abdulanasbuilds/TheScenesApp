# The Scenes Frontend Implementation Audit

Date: 4 November 2026  
Scope: user-authorized, fixture-backed frontend application review and repair  
Backend phase: unchanged; no production service was connected

Phase 2 status: **accepted by the founder on 4 November 2026**

## Outcome

The existing TanStack application was audited rather than replaced. All 30 requested primary page
types now resolve to their intended interface, share the correct public/auth/member/community or
creator shell, and pass the responsive route contract at 1440 × 900, 768 × 1024 and 390 × 844.

“Completed” below means the frontend route, responsive interface, navigation and supported local
interactions are implemented. It does **not** mean that authentication, persistence, payments,
payouts, uploads, email, live rooms or other production services are connected.

## Preserved architecture

- React 19 + TypeScript.
- TanStack Start and file-based TanStack Router routes.
- Tailwind CSS 4 styling with shared UI/domain components.
- Radix primitives for dialogs, menus, tabs and switches.
- Deterministic fixture data in `src/data/seed.ts`.
- Shared in-memory application state in `src/store/app-store.tsx`.
- Separate public, authentication, member, community and creator shells.

## Thirty-page inventory

| #   | Page type                      | Canonical route                                                        | Status                                               |
| --- | ------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------- |
| 01  | Main landing page              | `/`                                                                    | Completed                                            |
| 02  | Explore communities            | `/explore`                                                             | Completed                                            |
| 03  | Search results                 | `/search?q=agent`                                                      | Completed                                            |
| 04  | Public community               | `/communities/ai-builders-guild`                                       | Completed                                            |
| 05  | Public creator profile         | `/creators/nanaadjei`                                                  | Completed                                            |
| 06  | Pricing and membership         | `/pricing`                                                             | Completed; approved monthly directions displayed; checkout unavailable |
| 07  | Registration                   | `/register`                                                            | Completed; local preview only                        |
| 08  | Login                          | `/login`                                                               | Completed; deterministic demo session only           |
| 09  | Onboarding                     | `/onboarding`                                                          | Completed; local preview only                        |
| 10  | Member home/dashboard          | `/home`                                                                | Completed                                            |
| 11  | Community feed                 | `/c/ai-builders-guild`                                                 | Completed                                            |
| 12  | Individual discussion          | `/c/ai-builders-guild/posts/post-1`                                    | Completed                                            |
| 13  | Create/edit post               | `/c/ai-builders-guild/posts/new`                                       | Completed; edit uses `?edit=<local-post-id>`         |
| 14  | Notifications                  | `/notifications`                                                       | Completed; local read state                          |
| 15  | Members directory              | `/c/ai-builders-guild/members`                                         | Completed                                            |
| 16  | Member profile                 | `/c/ai-builders-guild/members/m-you`                                   | Completed                                            |
| 17  | Community calendar             | `/c/ai-builders-guild/calendar`                                        | Completed                                            |
| 18  | Event details                  | `/c/ai-builders-guild/events/ev-1`                                     | Completed; local RSVP state                          |
| 19  | Classroom/course library       | `/c/ai-builders-guild/classroom`                                       | Completed                                            |
| 20  | Course overview                | `/c/ai-builders-guild/classroom/ship-your-first-ai-agent`              | Completed                                            |
| 21  | Lesson viewer                  | `/c/ai-builders-guild/classroom/ship-your-first-ai-agent/les-agents-1` | Completed                                            |
| 22  | Leaderboard                    | `/c/ai-builders-guild/leaderboard`                                     | Completed as a clearly fixture-backed concept        |
| 23  | Creator dashboard              | `/dashboard/creator`                                                   | Completed; all metrics labelled as fixtures          |
| 24  | Community settings             | `/dashboard/community`                                                 | Completed; local save state                          |
| 25  | Member management              | `/dashboard/members`                                                   | Completed; local management state                    |
| 26  | Course builder                 | `/dashboard/courses`                                                   | Completed; local draft/builder state                 |
| 27  | Event management               | `/dashboard/events`                                                    | Completed; local event state                         |
| 28  | Marketplace discovery          | `/marketplace`                                                         | Completed as a later-phase frontend preview          |
| 29  | Product details/purchase       | `/marketplace/agent-blueprint-pack`                                    | Completed; checkout is explicitly simulated          |
| 30  | Commerce/enterprise management | `/dashboard/commerce`                                                  | Completed as an unconnected management preview       |

## Audit repairs

The audit found and repaired issues that prevented the previous implementation from satisfying its
own acceptance criteria:

1. The marketplace parent route swallowed product-detail children; product details and checkout now
   render through the nested route outlet.
2. Locally published posts could not open because the discussion loader only accepted seed posts;
   local discussions now open, can be edited and return to the feed without losing state.
3. Hydration races made mobile and parallel browser interactions intermittent; the app now exposes a
   deterministic client-ready marker used by E2E tests.
4. Lesson pages had no route back to cross-community learning; the viewer now links to My Learning.
5. Several visible overflow-menu buttons had no action; post, profile, community and creator-account
   menus now expose meaningful local or navigational actions.
6. “Copied” feedback did not always copy anything; supported post, discussion, profile and event
   share actions now use the Clipboard API with an honest fallback.
7. Pricing feature copy was aligned with ADR-029–030 on 4 November 2026: Free at a 7% sales fee, Pro
   $19 / GH₵300, Pro Plus $39 / GH₵620, external-link-only launch plans and no checkout.
8. Small muted text, account-menu names and an unlabelled dashboard select caused Lighthouse
   accessibility failures; representative audited routes now score 100 for accessibility.

## Reference evidence

Starter Story was used for visual principles; Skool was used for public application structure only.
Direct browser evidence, access limitations, measured values and screenshot paths are recorded in
`docs/FRONTEND-RESEARCH-EVIDENCE.md`.

Reference screenshots are under `docs/research-screenshots/`. No competitor assets, copy or branding
were added to the product.

Per the user’s final instruction, OpenPencil/Figma work was not inspected or modified during this
audit. No reuse claim is made.

## Verification evidence

### Static and production checks

- `bun run typecheck` — passed.
- `bun run lint` — passed.
- `bun run build` — passed for client, SSR and Cloudflare-module output.
- Non-blocking build notices remain for the now-native Vite tsconfig-path capability and Nitro’s
  ignored `inlineDynamicImports` option.

### Browser checks

- `npx playwright test --workers=3` — **23 passed, 4 intentionally skipped**.
- The four skips are duplicate tablet/mobile executions of two viewport-independent contracts: the
  HTTP-only 30-route check and the discovered internal-link graph. Both run once on desktop.
- Six critical journeys passed at all three exact viewports: search/discovery, demo login, post
  create/edit, lesson completion, creator event creation and preview checkout.
- Every canonical route was rendered at all three viewports and checked for a visible main landmark,
  visible H1, browser errors, accidental 404 output and document-level horizontal overflow.
- Internal links discovered across all primary pages were crawled and verified to resolve without
  an HTTP failure or accidental application 404.
- Eighteen representative screenshots are in `.playwright/qa-screenshots/` (six surfaces × three
  viewports).
- Six curated desktop/tablet/mobile captures are preserved for review under
  `docs/implementation-screenshots/`.

### Accessibility/SEO checks

Lighthouse was run in the attached Chromium browser against the landing page, community feed,
lesson viewer and creator dashboard. Each returned:

- Accessibility: 100
- Best Practices: 100
- SEO: 100

These representative audits do not prove that every possible state is defect-free; they are combined
with the route-wide semantic and overflow checks above.

## Data and integration boundaries

Working local behavior includes filters, sorting, tabs, search, menus, dialogs, form validation,
notifications, joins, reactions, comments, post creation/editing, lesson completion, RSVP state,
creator management drafts and simulated purchase state.

The following remain intentionally unconnected:

- production authentication and authorization;
- persistent database/API storage;
- uploads and protected downloads;
- transactional email and push notifications;
- real video/live-room providers;
- payment collection, refunds, earnings, payouts and enterprise billing;
- production moderation/reporting;
- production analytics and search infrastructure.

Local in-memory state resets when the application session resets. Post drafts use session storage.
No operation should be interpreted as production success.

## Run locally

```bash
bun install
bun run dev
```

Open `http://127.0.0.1:5000`.

Production verification:

```bash
bun run typecheck
bun run lint
bun run build
npx playwright test --workers=3
```

No deployment, production mutation, secret access or remote repository write was performed.
