# The Scenes — Feature Traceability Matrix

> **Frontend checkpoint (4 November 2026):** a user-authorized Phase 2 fixture frontend now covers
> all 30 requested primary page types and has passed route-wide desktop/tablet/mobile verification.
> The older row-level statuses below have not all been reconciled with the new frontend evidence and
> must not be read as proof that an implemented fixture surface is absent. The verified page and
> integration inventory is `docs/FRONTEND-IMPLEMENTATION-AUDIT.md`. Production backend/provider
> rows remain NOT STARTED unless explicitly changed in a later authorized phase.

This document tracks every major feature from requirement through delivery.

Cross-reference: All requirement IDs are defined in `docs/PRODUCT-REQUIREMENTS.md`.

## Status definitions

| Status      | Meaning                            |
| ----------- | ---------------------------------- |
| NOT STARTED | No work begun                      |
| DESIGNING   | In design exploration              |
| DESIGNED    | Design approved                    |
| BUILDING    | In frontend/backend implementation |
| BUILT       | Implementation complete            |
| TESTING     | In verification                    |
| RELEASED    | Live and verified                  |
| BLOCKED     | Waiting on dependency or decision  |
| DEFERRED    | Intentionally postponed            |

---

## Feature matrix

| Requirement    | Description                     | Source | Priority | Phase                   | Surface        | Dependency        | Security concern         | Status             |
| -------------- | ------------------------------- | ------ | -------- | ----------------------- | -------------- | ----------------- | ------------------------ | ------------------ |
| **TS-AUTH**    | **Authentication & Access**     |        |          |                         |                |                   |                          |                    |
| TS-AUTH-001    | User signup                     | S1     | P1       | 3                       | Auth           | Supabase Auth     | Credential security      | NOT STARTED        |
| TS-AUTH-002    | User login                      | S1     | P1       | 3                       | Auth           | Supabase Auth     | Session management       | NOT STARTED        |
| TS-AUTH-003    | User profiles                   | S1     | P1       | 2 (fixture) / 3 (real)  | All            | TS-AUTH-001       | Profile data privacy     | NOT STARTED        |
| TS-AUTH-005    | Password reset                  | S2     | P1       | 3                       | Auth           | Resend, Supabase  | Token expiry             | NOT STARTED        |
| TS-AUTH-008    | Role-based access               | S2     | P1       | 3                       | All            | TS-AUTH-001       | Authorization bypass     | NOT STARTED        |
| **TS-COMM**    | **Community**                   |        |          |                         |                |                   |                          |                    |
| TS-COMM-001    | Community feed                  | S1     | P1       | 1–2                     | Community      | —                 | Content moderation       | NOT STARTED        |
| TS-COMM-002    | Posts                           | S1     | P1       | 1–2                     | Community      | —                 | XSS, content safety      | NOT STARTED        |
| TS-COMM-003    | Comments                        | S1     | P1       | 1–2                     | Community      | TS-COMM-002       | Abuse, spam              | NOT STARTED        |
| TS-COMM-004    | Likes/reactions                 | S1     | P2       | 1–2                     | Community      | TS-COMM-002       | Rate limiting            | NOT STARTED        |
| TS-COMM-005    | Unresolved interaction ("tha…") | S1     | —        | —                       | Community      | —                 | —                        | BLOCKED (OPD-001)  |
| TS-COMM-006    | Community membership            | S1     | P1       | 1–2                     | Community      | —                 | Access control           | NOT STARTED        |
| TS-COMM-007    | Community discovery             | S1     | P1       | 1–2                     | Public, Auth   | —                 | —                        | NOT STARTED        |
| TS-COMM-008    | Community moderation            | S1     | P1       | 5                       | Admin, Creator | TS-AUTH-008       | Abuse, fairness          | NOT STARTED        |
| TS-COMM-011    | Creator/community admin         | S1     | P1       | 1–2                     | Creator        | —                 | Authorization            | NOT STARTED        |
| TS-COMM-012    | Community categories/topics     | S2     | P2       | 1–2                     | Community      | —                 | —                        | NOT STARTED        |
| TS-COMM-015    | Community rules display         | S2     | P2       | 1–2                     | Community      | —                 | —                        | NOT STARTED        |
| **TS-CLASS**   | **Classroom / Learning**        |        |          |                         |                |                   |                          |                    |
| TS-CLASS-001   | Courses                         | S1     | P1       | 1–2                     | Public, Auth   | —                 | —                        | NOT STARTED        |
| TS-CLASS-002   | Course structure (modules)      | S1     | P1       | 1–2                     | Auth, Creator  | —                 | —                        | NOT STARTED        |
| TS-CLASS-003   | Lessons                         | S1     | P1       | 1–2                     | Auth           | TS-CLASS-002      | Content access           | NOT STARTED        |
| TS-CLASS-004   | Learning progression            | S1     | P1       | 1–2                     | Auth           | TS-CLASS-003      | —                        | NOT STARTED        |
| TS-CLASS-005   | Classroom experience            | S1     | P1       | 1–2                     | Auth           | TS-CLASS-003      | Video/content access     | NOT STARTED        |
| TS-CLASS-006   | Embedded video content          | S1     | P1       | 6                       | Auth           | Provider adapter  | Secure delivery          | NOT STARTED        |
| TS-CLASS-007   | Completion tracking             | S1     | P1       | 2 (design) / 3 (real)   | Auth           | TS-CLASS-003      | —                        | NOT STARTED        |
| TS-CLASS-016   | Code syntax highlighting        | S1     | P2       | 2                       | All content    | —                 | XSS in code display      | NOT STARTED        |
| TS-CLASS-008   | Learning states                 | S1     | P1       | 1–2                     | Auth           | TS-CLASS-003      | —                        | NOT STARTED        |
| TS-CLASS-010   | Lesson resources                | S1     | P1       | 1–2                     | Auth           | TS-CLASS-003      | —                        | NOT STARTED        |
| TS-CLASS-012   | Course enrollment               | S2     | P1       | 1–2                     | Auth           | —                 | —                        | NOT STARTED        |
| **TS-EVENT**   | **Events / Live**               |        |          |                         |                |                   |                          |                    |
| TS-EVENT-001   | Events                          | S1     | P1       | 1–2                     | Public, Auth   | —                 | —                        | NOT STARTED        |
| TS-EVENT-002   | Calendar/scheduling             | S1     | P2       | 1–2                     | Auth, Creator  | —                 | —                        | NOT STARTED        |
| TS-EVENT-004   | Live sessions                   | S1     | P1       | 6                       | Auth           | Provider adapter  | Session security         | NOT STARTED        |
| TS-EVENT-005   | Event pages                     | S1     | P1       | 1–2                     | Public, Auth   | —                 | —                        | NOT STARTED        |
| TS-EVENT-003   | Scheduled sessions              | S1     | P1       | 1–2                     | Auth, Creator  | —                 | —                        | NOT STARTED        |
| TS-EVENT-006   | Registration/join flow          | S1     | P1       | 1–2                     | Auth           | TS-EVENT-001      | —                        | NOT STARTED        |
| **TS-GAME**    | **Gamification**                |        |          |                         |                |                   |                          |                    |
| TS-GAME-001    | Points system                   | S1     | P2       | 5                       | Auth           | TS-CLASS, TS-COMM | Gaming/manipulation      | NOT STARTED        |
| TS-GAME-002    | Progress tracking (visual)      | S1     | P1       | 1–2                     | Auth           | —                 | —                        | NOT STARTED        |
| TS-GAME-003    | Streaks                         | S1     | —        | —                       | Auth           | —                 | —                        | BLOCKED (OPD-005)  |
| TS-GAME-005    | Badges                          | S1     | P3       | 5                       | Auth           | TS-GAME-001       | —                        | NOT STARTED        |
| TS-GAME-007    | Completion states               | S1     | P1       | 1–2                     | Auth           | —                 | —                        | NOT STARTED        |
| **TS-PAY**     | **Payments**                    |        |          |                         |                |                   |                          |                    |
| TS-PAY-001     | Customer checkout               | S1     | P1       | 7                       | Auth           | Payment provider  | PCI, fraud               | NOT STARTED        |
| TS-PAY-002     | Subscriptions                   | S1     | P1       | 7                       | Auth           | Payment provider  | Recurring billing        | NOT STARTED        |
| TS-PAY-006     | Creator payouts                 | S1     | P1       | 8                       | Creator        | TS-PAY-001        | Financial accuracy       | NOT STARTED        |
| TS-PAY-013     | Instant payout fee rule          | S1     | P2       | 7                       | Creator payout | Payment provider  | Fee clarity, audit trail | DEFERRED (ADR-034) |
| **TS-FILE**    | **File Hosting**                |        |          |                         |                |                   |                          |                    |
| TS-FILE-001    | PDF hosting                     | S1     | —        | Conditional / later     | Auth, Creator  | New decision      | Access control           | DEFERRED (ADR-029) |
| TS-FILE-007    | Private/public classification   | S2     | —        | Conditional / later     | All            | New decision      | Link leaks               | DEFERRED (ADR-029) |
| TS-FILE-009    | Signed access URLs              | S2     | —        | Conditional / later     | All            | New decision      | Expiry, authorization    | DEFERRED (ADR-029) |
| **TS-MKT**     | **Marketplace**                 |        |          |                         |                |                   |                          |                    |
| TS-MKT-001     | Digital product listings        | S1     | P1       | 8                       | Public, Auth   | TS-PAY            | —                        | NOT STARTED        |
| TS-MKT-002     | Workflow/template sales         | S1     | P1       | 8                       | Auth           | TS-MKT-001        | IP, downloads            | NOT STARTED        |
| **TS-AI**      | **AI**                          |        |          |                         |                |                   |                          |                    |
| TS-AI-001      | General platform assistant      | S1     | P2       | 9                       | Auth           | AI provider       | Privacy, cost            | NOT STARTED        |
| TS-AI-008      | Provider-agnostic AI layer      | S2     | P1       | 9                       | Internal       | —                 | Vendor lock-in           | NOT STARTED        |
| **TS-REF**     | **Referrals**                   |        |          |                         |                |                   |                          |                    |
| TS-REF-001     | Referral links                  | S1     | P1       | 5                       | Auth, Creator  | —                 | Abuse                    | NOT STARTED        |
| TS-REF-003     | Qualification rules             | S2     | P1       | 5                       | Internal       | TS-REF-001        | Fraud                    | NOT STARTED        |
| TS-REF-004     | Reward/entitlement system       | S1     | P1       | 5                       | Internal       | TS-REF-003        | Entitlement ≠ capacity   | NOT STARTED        |
| TS-REF-007     | Creator referral dashboard      | S1     | P1       | 1–2 (design)            | Creator        | —                 | —                        | NOT STARTED        |
| **TS-DM**      | **Private Messaging**           |        |          |                         |                |                   |                          |                    |
| TS-DM-001      | User-to-user messaging          | S1     | P2       | 5                       | Auth           | Supabase Realtime | Abuse, privacy           | NOT STARTED        |
| TS-DM-007      | Auto-DM onboarding sequences    | S1     | —        | —                       | Auth           | —                 | Spam, consent            | DEFERRED (OPD-007) |
| **TS-GUEST**   | **Guest Access**                |        |          |                         |                |                   |                          |                    |
| TS-GUEST-001   | Guest links                     | S1     | P2       | 5                       | Public         | —                 | Private content exposure | NOT STARTED        |
| **TS-DISC**    | **Discovery**                   |        |          |                         |                |                   |                          |                    |
| TS-DISC-001    | Public explore                  | S1     | P1       | 1–2                     | Public         | —                 | —                        | NOT STARTED        |
| TS-DISC-002    | Category pages                  | S1     | P1       | 1–2                     | Public         | —                 | —                        | NOT STARTED        |
| TS-DISC-003    | Authenticated home              | S1     | P1       | 1–2                     | Auth           | —                 | —                        | NOT STARTED        |
| TS-DISC-007    | Creator/teacher profiles        | S1     | P1       | 1–2                     | Public         | —                 | —                        | NOT STARTED        |
| **TS-LAND**    | **Landing & Marketing**         |        |          |                         |                |                   |                          |                    |
| TS-LAND-001    | Marketing landing page          | S1     | P1       | 1–2                     | Public         | —                 | —                        | NOT STARTED        |
| TS-LAND-003    | Become a Teacher                | S2     | P1       | 1–2                     | Public         | —                 | —                        | NOT STARTED        |
| TS-LAND-002    | Pricing page                    | S2     | P1       | 1–2                     | Public         | —                 | —                        | NOT STARTED        |
| TS-LAND-004    | About page                      | S2     | P2       | 1–2                     | Public         | —                 | —                        | NOT STARTED        |
| TS-LAND-005    | Help page                       | S2     | P2       | 1–2                     | Public         | —                 | —                        | NOT STARTED        |
| TS-LAND-007    | SEO for public pages            | S2     | P2       | 2                       | Public         | —                 | —                        | NOT STARTED        |
| **TS-TEACH**   | **Creator Workspace**           |        |          |                         |                |                   |                          |                    |
| TS-TEACH-001   | Creator overview                | S1     | P1       | 1–2                     | Creator        | —                 | —                        | NOT STARTED        |
| TS-TEACH-002   | Course builder                  | S1     | P1       | 1–2 (design) / 5 (real) | Creator        | —                 | Content integrity        | NOT STARTED        |
| TS-TEACH-009   | Earnings dashboard              | S1     | P1       | 1–2 (design)            | Creator        | —                 | Financial accuracy       | NOT STARTED        |
| TS-TEACH-010   | Analytics dashboard             | S1     | P1       | 1–2 (design)            | Creator        | —                 | —                        | NOT STARTED        |
| TS-TEACH-003   | Lesson builder                  | S1     | P1       | 1–2 (design) / 5 (real) | Creator        | —                 | Content integrity        | NOT STARTED        |
| TS-TEACH-007   | Student/audience view           | S1     | P1       | 1–2                     | Creator        | —                 | —                        | NOT STARTED        |
| TS-TEACH-011   | Creator settings                | S2     | P2       | 1–2                     | Creator        | —                 | —                        | NOT STARTED        |
| **TS-ADMIN**   | **Admin Workspace**             |        |          |                         |                |                   |                          |                    |
| TS-ADMIN-001   | Admin overview                  | S2     | P1       | 1–2 (design)            | Admin          | —                 | Authorization            | NOT STARTED        |
| TS-ADMIN-011   | Provider usage monitoring       | S2     | P1       | 6                       | Admin          | Provider adapters | —                        | NOT STARTED        |
| TS-ADMIN-012   | Analytics (design)              | S2     | P1       | 1–2 (design)            | Admin          | —                 | —                        | NOT STARTED        |
| **TS-NOTIFY**  | **Notifications**               |        |          |                         |                |                   |                          |                    |
| TS-NOTIFY-001  | In-app notifications            | S2     | P1       | 1–2 (design)            | Auth           | —                 | —                        | NOT STARTED        |
| TS-NOTIFY-005  | Notification center UI          | S2     | P1       | 1–2 (design)            | Auth           | —                 | —                        | NOT STARTED        |
| **TS-ONBOARD** | **Onboarding**                  |        |          |                         |                |                   |                          |                    |
| TS-ONBOARD-001 | User onboarding flow            | S2     | P1       | 1–2                     | Auth           | —                 | —                        | NOT STARTED        |
| TS-ONBOARD-002 | Creator onboarding flow         | S2     | P1       | 1–2                     | Creator        | —                 | —                        | NOT STARTED        |
| TS-ONBOARD-003 | Interest/preference selection   | S2     | P2       | 1–2                     | Auth           | —                 | —                        | NOT STARTED        |
| **TS-WORK**    | **Workflows & Resources**       |        |          |                         |                |                   |                          |                    |
| TS-WORK-001    | Workflow library                | S1     | P1       | 1–2                     | Auth           | —                 | —                        | NOT STARTED        |
| TS-WORK-002    | Resource library                | S1     | P1       | 1–2                     | Auth           | —                 | —                        | NOT STARTED        |
| TS-REF-010     | Referral milestone states       | S2     | P1       | 1–2 (design)            | Creator        | —                 | —                        | NOT STARTED        |
| TS-GUEST-002   | Creator/course previews         | S1     | P1       | 1–2                     | Public         | —                 | Content exposure         | NOT STARTED        |
| **TS-MOBILE**  | **Mobile & PWA**                |        |          |                         |                |                   |                          |                    |
| TS-MOBILE-001  | Mobile-first design             | S1, S2 | P1       | 1–2                     | All            | —                 | —                        | NOT STARTED        |
| TS-MOBILE-002  | PWA installability              | S2     | P2       | 4                       | All            | —                 | —                        | NOT STARTED        |
| **TS-OPS**     | **Operations**                  |        |          |                         |                |                   |                          |                    |
| TS-OPS-001     | Error handling UI               | S2     | P1       | 1–2                     | All            | —                 | —                        | NOT STARTED        |
| TS-OPS-002     | Loading states                  | S2     | P1       | 1–2                     | All            | —                 | —                        | NOT STARTED        |
| TS-OPS-003     | Empty states                    | S2     | P1       | 1–2                     | All            | —                 | —                        | NOT STARTED        |
| TS-OPS-005     | CI/CD                           | S2     | P1       | 0                       | Internal       | GitHub Actions    | Secret exposure          | BUILT              |

---

## Phase summary

| Phase                            | Status                        | Key deliverables                                    |
| -------------------------------- | ----------------------------- | --------------------------------------------------- |
| 0 — Governance                   | **BUILT / ONGOING**           | Agent contract, docs, CI, architecture decisions    |
| 1 — Design exploration           | **DESIGNED**                  | Reference-informed direction implemented in code    |
| 2 — Frontend with fixtures       | **BUILT — ACCEPTED**          | 30 primary pages, responsive shells and local flows |
| 3A — Local backend proof         | **FOUNDER APPROVED — FINAL TECHNICAL REVIEW** | Isolated local learner proof; no hosted provider    |
| 4 — Email/files/notifications    | NOT STARTED                   | Resend, PWA, Redis; conditional narrow R2 use       |
| 5 — Creator operations           | NOT STARTED                   | Teacher flows, referrals, messaging, moderation     |
| 6 — Live/media/storage providers | DEFERRED (ADR-029)            | Conditional adapters; new decision required         |
| 7 — Payments                     | NOT STARTED                   | Checkout, subscriptions, webhooks                   |
| 8 — Marketplace                  | NOT STARTED                   | Digital products, splits, creator economy           |
| 9 — Search + AI                  | NOT STARTED                   | Intelligent search, AI assistant                    |
| 10 — Scale                       | NOT STARTED                   | Organizations, multi-tenancy                        |

> Next actionable work (the Gate A pre-Phase-3 blockers, then Phase 3) is ordered in
> `docs/PHASES.md` → "Next work — ordered (4 November 2026)".

Broad requirements historically assigned to "Phase 3" do not all belong to Phase 3A. Password-email
delivery, global creator/admin roles, live search, administration and other provider-backed operations
remain in their later approved phases. Only the revision-3 local learner slice may move through Gate A.

## Update rule

When a feature moves to a new status, update this matrix and note the date in the commit message.
