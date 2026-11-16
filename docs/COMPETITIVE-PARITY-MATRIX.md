# Competitive parity matrix — The Scenes

**Last updated:** 16 November 2026
**Source:** `video_analysis_report.pdf` (Skool.com and Circle.so community-building guides).
**Scope:** the clickable fixture frontend (`VITE_DATA_MODE=fixtures`). No production backend, payment,
provider, admin, AI or native-video work is claimed here.

This matrix maps every feature the report lists to its real state in the application.

Legend:

- **Implemented** — working behaviour in the fixture frontend, or a real in-product surface. All
  persisted state is in-memory per browser tab and resets on reload.
- **Placeholder** — the interface exists and is honest about what is not connected, but the underlying
  integration (email, payment, provider, WYSIWYG editor, map tiles, DNS) is not present.
- **Blocked** — needs founder approval, provider keys/accounts, or a later approved phase before any
  implementation is legitimate.

Nothing under "Blocked" may be faked as connected. Fixture and mock data will be reset in production so
creators upload their own assets and create their own categories.

## VIDEO 1 — Skool.com Complete Setup Guide

| Feature                                            | Status                  | Where / notes                                                                           |
| -------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| Unified chat and notifications                     | Placeholder             | In-app notifications implemented; real-time chat is a space type only, no socket layer  |
| Dedicated classroom for courses                    | Implemented             | Per-community classroom and lesson viewer                                               |
| Shared calendar for events                         | Implemented             | Community calendar + event pages                                                        |
| Leaderboards and gamification                      | Implemented             | Fixture levels, points and leaderboard                                                  |
| Discovery marketplace                              | Implemented             | `/explore` with search, filters and sorting                                             |
| Subscription management, multiple tiers            | Placeholder             | Pricing page describes tiers; no billing engine                                         |
| Plugin ecosystem (Zapier, webhooks)                | Blocked                 | Needs provider wiring and Phase approval                                                |
| Metrics and analytics for growth                   | Implemented             | Creator dashboard fixture metrics                                                       |
| 14-day free trial, no card                         | Placeholder             | Onboarding copy; no billing trial                                                       |
| Community name editable later                      | Implemented             | Community settings → General                                                            |
| $99/month subscription                             | Placeholder             | Our approved launch direction is external-link resources (ADR-029), not a price clone   |
| Human verification                                 | Blocked                 | Anti-bot provider not connected; no fake captcha                                        |
| Upload community icon (128×128)                    | Implemented             | Branding tab — preview-only upload                                                      |
| Upload cover photo (1084×576)                      | Implemented             | Branding tab — preview-only upload                                                      |
| Clear group description                            | Implemented             | Community settings + public page                                                        |
| Brand colour by hex                                | Implemented             | Branding tab with hex validation and swatch                                             |
| Privacy: Private or Public                         | Implemented             | Privacy setting + concealed private child content                                       |
| Canva/Photoshop templates                          | Implemented (stock)     | CC0/public-domain covers in `public/media/` with provenance in `docs/ASSET-PROVENANCE.md`; no external template copied |
| "Start Here" intro post                            | Implemented             | Pinned welcome post + member start-here checklist                                       |
| "Add Action" required tasks                        | Implemented             | Screening questions + checklist steps                                                   |
| Pinned welcome post                                | Implemented             | Pinned post flag in the feed                                                            |
| Automated DMs on join                              | Placeholder             | Fixture welcome notification; no DM provider                                            |
| Membership screening questions (up to 3)           | Implemented             | Public community page before joining                                                    |
| Course name, description, cover (1460×752)         | Implemented             | Course editor with cover upload                                                         |
| Lessons organised into folders                     | Implemented             | Modules and lessons                                                                     |
| Rich text editor (headings, bold, italics, strike) | Placeholder             | Lesson bodies are structured text, no WYSIWYG editor                                    |
| Code blocks                                        | Placeholder             | No code-block editor component                                                          |
| Bullet and numbered lists                          | Implemented             | Structured lesson body spacing                                                          |
| Embed video (YouTube, Vimeo, Loom, Wistia)         | Placeholder             | External resource links; no inline iframe embed                                         |
| File attachments and resource links                | Implemented             | Lesson resources as external links                                                      |
| Drip content (unlock after N days)                 | Implemented             | Per-lesson drip days measured from join date                                            |
| Calendar events (Q&A, coffee hours, co-working)    | Implemented             | Event kinds and pages                                                                   |
| One-time or recurring events                       | Placeholder             | One-time fixture events; recurrence UI not built                                        |
| Meeting links or physical addresses                | Placeholder             | Event location field only                                                               |
| Email reminder one day before                      | Placeholder             | Toggle implemented; no email delivery                                                   |
| Custom level names                                 | Placeholder             | Fixed fixture names                                                                     |
| Point requirement per level                        | Placeholder             | Fixture thresholds                                                                      |
| Rewards linked to levels                           | Placeholder             | Referral entitlements only                                                              |
| Member progress on leaderboards                    | Implemented             | Leaderboard view                                                                        |
| Stripe payment processing                          | Blocked                 | Payments layer on HOLD                                                                  |
| Zapier CRM sync                                    | Blocked                 | Needs provider approval                                                                 |
| Meta Pixel tracking                                | Blocked                 | Needs provider approval                                                                 |
| External links in sidebar                          | Implemented             | Spaces tab → external links (https-only)                                                |
| Membership screening questions                     | Implemented             | Same as above                                                                           |

## VIDEO 2 — Circle.so Complete Community Setup Guide

| Feature                                             | Status                | Where / notes                                                               |
| --------------------------------------------------- | --------------------- | --------------------------------------------------------------------------- |
| Space-based organisation                            | Implemented           | Spaces tab; seeded space groups                                             |
| Multiple space types (Posts, Chat, Events, Courses) | Implemented           | Type selector per space                                                     |
| Customisable layouts (Feed, List, Card)             | Implemented           | Layout selector per space                                                   |
| Advanced rich text editor                           | Placeholder           | See editor rows above                                                       |
| Native live streaming                               | Blocked               | Not approved; external links only                                           |
| Integrated Stripe payment processing                | Blocked               | Payments on HOLD                                                            |
| Tiered subscription and paywall                     | Placeholder           | Pricing/paywall described, not enforced                                     |
| Member progress tracking and analytics              | Implemented           | Fixture progress and analytics                                              |
| Community name and URL                              | Implemented (name)    | Custom URL/domain is a placeholder below                                    |
| Public or private community                         | Implemented           | Privacy setting                                                             |
| Customise brand colour                              | Implemented           | Branding tab                                                                |
| Upload community logo (200×50)                      | Implemented           | Branding → Wordmark logo; rendered in the community sidebar and public hero |
| Upload community icon (32×32)                       | Implemented           | Icon upload                                                                 |
| Light/dark mode toggle                              | Placeholder           | Light only; dark not implemented and labelled so                            |
| Default theme for members                           | Placeholder           | Theme selector disabled and explained                                       |
| High-level space groups                             | Implemented           | Group field per space                                                       |
| Space types (Posts/Chat/Events/Courses)             | Implemented           | Same as above                                                               |
| Space icons (images, no emojis)                     | Implemented           | Image-only by product policy (no emojis)                                    |
| Feed / List / Card layouts                          | Implemented           | Layout selector                                                             |
| Backslash-command editor                            | Placeholder           | No command editor                                                           |
| Formatting tools (headings, bullets, dividers)      | Placeholder           | Structured text only                                                        |
| Embed YouTube/Vimeo in posts and lessons            | Placeholder           | External links                                                              |
| Attach files (PDFs, spreadsheets)                   | Placeholder           | Resource links, no binary upload                                            |
| Bookmarking saved content                           | Implemented           | Saved/bookmark controls                                                     |
| Schedule events (title, host, date, time)           | Implemented           | Event editor                                                                |
| Recurring events                                    | Placeholder           | Not built                                                                   |
| Live Stream / Live Room formats                     | Blocked               | Needs provider and approval                                                 |
| Automatic recording and replay                      | Blocked               | Needs provider                                                              |
| RSVPs and calendar integration                      | Implemented (RSVP)    | RSVP works; ICS/calendar sync not connected                                 |
| Automatic email reminders                           | Placeholder           | Copy present; no delivery                                                   |
| Modules and lessons                                 | Implemented           | Course structure                                                            |
| Featured media (video/audio)                        | Placeholder           | External links, no hosting                                                  |
| Text descriptions and downloadable files            | Implemented (text)    | Downloads are external links                                                |
| Track progress and completion                       | Implemented           | Learning state in memory                                                    |
| Draft mode before publishing                        | Implemented           | Course status draft/published                                               |
| Products with defined pricing                       | Placeholder           | Commerce preview; payments blocked                                          |
| Spaces assigned to paywalls                         | Placeholder           | Described, not enforced                                                     |
| Subscription groups (upgrades/downgrades)           | Placeholder           | Described, not enforced                                                     |
| Private paywall-gated spaces                        | Implemented (privacy) | Private space concealment works                                             |
| Post-purchase redirects                             | Placeholder           | Needs payments                                                              |
| Invitation URLs with access levels                  | Implemented           | Referrals → invitation links                                                |
| Coupons or free trials on invitation links          | Implemented           | Coupon + trial-day fields                                                   |
| "Start Here" onboarding space                       | Implemented           | Checklist and welcome content                                               |
| Guided steps for new members                        | Implemented           | Onboarding flow                                                             |
| Route new members after purchase                    | Placeholder           | Needs payments                                                              |
| Custom domains                                      | Placeholder           | Discovery tab field; DNS/TLS/routing not connected                          |

## VIDEO 3 — Skool.com Advanced Features and Settings

| Feature                                                     | Status                    | Where / notes                                                 |
| ----------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- |
| Dashboard member count                                      | Implemented               | Creator overview                                              |
| MRR monitoring                                              | Implemented               | Fixture estimate, labelled not financial data                 |
| Engagement level metrics                                    | Implemented               | Fixture metrics                                               |
| Member retention rates                                      | Implemented               | Fixture cohort model                                          |
| Page visitor statistics                                     | Implemented               | Fixture traffic                                               |
| Conversion rate tracking                                    | Implemented               | Fixture conversion                                            |
| Classroom, calendar, members tab, leaderboards              | Implemented               | All present                                                   |
| Map feature for member locations                            | Placeholder               | Location summary by city; no map tiles                        |
| About page as community landing                             | Implemented               | Community public page                                         |
| "Set up your group" checklist                               | Implemented               | Creator setup checklist on `/dashboard/creator`               |
| Up to 11 discovery keywords                                 | Implemented               | Discovery tab, cap enforced at 11                             |
| Optimised description for search                            | Implemented               | Community description + keywords                              |
| About page media and descriptions                           | Implemented               | Public community page                                         |
| Non-members can preview                                     | Implemented               | Public preview with protected content locked                  |
| Pricing models (free/subscription/freemium/tiered/one-time) | Placeholder               | Pricing page; no billing                                      |
| Stripe link, payout frequency, payment methods, history     | Blocked                   | Payments on HOLD                                              |
| Affiliate commission 10%–50%                                | Implemented               | Referrals → commission control                                |
| Reward members for referring paying clients                 | Implemented (fixture)     | Affiliate table                                               |
| Track affiliate performance and payouts                     | Implemented (performance) | Payout balance is a labelled placeholder                      |
| Incentive structure for referrals                           | Implemented               | Reward tiers and entitlements                                 |
| Membership questions (up to 3)                              | Implemented               | Screening questions                                           |
| Auto DM                                                     | Placeholder               | Fixture notification only                                     |
| Zapier integration                                          | Blocked                   | Needs provider approval                                       |
| Tracking pixels (Meta/Google)                               | Blocked                   | Needs provider approval                                       |
| Gamified unlocking (level-based course unlock)              | Placeholder               | Drip content implemented; level gating not                    |
| Tiered access (higher includes lower)                       | Placeholder               | Described, not enforced                                       |
| Email broadcasts (once every 72 hours)                      | Placeholder               | 72-hour cooldown copy shown; no email service                 |
| Course importing via Course Key                             | Implemented (local)       | Import modal; cross-community transfer needs server           |
| Native video hosting                                        | Blocked                   | ADR-029 external links; native hosting needs a later decision |
| Icon design guidance (simple, text-free)                    | Implemented               | Guidance copy + generated placeholders                        |
| Spam prevention: Level 2/3 before posting                   | Implemented               | Minimum posting level setting                                 |
| Privacy defaults to Private                                 | Implemented               | Privacy setting                                               |
| Freemium trust-then-upsell                                  | Placeholder               | Described; no billing                                         |
| Traffic diversification (external channels)                 | Implemented (copy)        | Referral/invite guidance                                      |
| Event reminder "1 day before" toggle                        | Placeholder               | Toggle works; no email delivery                               |

## Blocked items that need a founder decision or provider

These are intentionally not implemented and must not be represented as connected:

1. Payments/Stripe (commission payouts, tiers, checkout, post-purchase redirects) — payments layer on HOLD.
2. Production authentication, secrets and email delivery (Resend).
3. Admin workspace and moderation tooling.
4. Production AI layer.
5. Native video hosting and live streaming.
6. Custom domains: DNS, TLS and routing.
7. Meta/Google tracking pixels.
8. Zapier/webhooks and other automation providers.
9. Real binary upload storage (R2/Supabase Storage) — current uploads are preview-only in the browser tab.
10. Real-time chat sockets and automated direct messages.

## Verification for this matrix

- `tsc --noEmit` (app and scripts): pass.
- `eslint .`: pass.
- Production build: pass.
- Playwright route/visual contracts: pass (categories route included).
- Full fixture suite: **32 passed, 16 skipped, 0 failed**.
- Emoji scan of `src`: zero emoji or decorative glyphs remain (real icons or styled dots only).

Fixture data is intentionally mock and will be reset in production; creators will upload their own
banners, icons and space icons, and create their own categories.

## Media, imagery and copy pass — 16 November 2026

- Community and course covers now use real CC0/public-domain photography instead of generated cover
  art. Provenance, dimensions and source pages are recorded in `docs/ASSET-PROVENANCE.md`.
- The public landing page has a "See the app" section built from four real screenshots of this
  application (creator overview, community home, classroom lesson, explore), with descriptive alt text.
- The creator call-to-action on the landing page shows the real creator overview instead of generated
  art and invented weekly statistics.
- Wordmark logos can be uploaded from the Branding tab, and the stored logo renders in the community
  sidebar and public hero. Uploads remain preview-only until object storage is connected.
- Public and in-product copy that previously described internal implementation state now says
  "Coming soon" in plain language. Honest limits remain where a test or a user promise requires them
  (for example, no reset email is claimed, and no payment is described as taken).
- No competitor source, asset, icon or wording was copied. No provider, payment, storage, DNS, email or
  video integration is claimed as connected.

### Evidence for this pass

- `npm run typecheck`: pass (app and scripts).
- `eslint .`: pass.
- Production build: pass.
- Playwright `critical-flows`, `visual-contract` (desktop/tablet/mobile) and `password-recovery`:
  **30 passed, 0 failed**.
- Browser check of `/`: four screenshot images load at 2160×1350, no console errors and no horizontal
  overflow at the tested viewports.
- The full fixture suite was attempted twice; both runs were interrupted by the local dev server
  restarting mid-run, so this pass records the targeted suites rather than a fresh full-suite number.

