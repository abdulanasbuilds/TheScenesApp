# The Scenes — Canonical Product Requirements

This is the single source of truth for all product requirements.

Every feature, capability, and product surface must be traceable from this document through design, implementation, testing, and release.

## Requirement classification

| Classification     | Meaning                                                    |
| ------------------ | ---------------------------------------------------------- |
| CORE NOW           | Needed for current frontend/product foundation (Phase 0–2) |
| CORE LATER         | Definitely part of The Scenes but belongs to a later phase |
| DEFERRED           | Known requirement, intentionally postponed                 |
| NEEDS DECISION     | Business/product question not finalized                    |
| LEGACY IMPL DETAIL | Historical technical approach, not necessarily current     |
| REJECTED           | Explicitly rejected with documented reason                 |

## Source reference

Requirements originate from:

- **S1**: Original June 1, 2026 product notes (SukaSpace/The Scenes concept)
- **S2**: Advanced platform requirements (production-grade expansion)
- **S3**: Architecture decisions (documented in `docs/DECISIONS.md`)
- **S4**: User/founder direction

---

## TS-AUTH: Authentication & Access

| ID          | Requirement                                 | Source | Classification                         | Phase | Notes                            |
| ----------- | ------------------------------------------- | ------ | -------------------------------------- | ----- | -------------------------------- |
| TS-AUTH-001 | User signup                                 | S1     | CORE LATER                             | 3     | Supabase Auth direction (ADR)    |
| TS-AUTH-002 | User login                                  | S1     | CORE LATER                             | 3     |                                  |
| TS-AUTH-003 | User profiles                               | S1     | CORE NOW (fixture) / CORE LATER (real) | 2/3   | Frontend fixture in Phase 2      |
| TS-AUTH-004 | Account management                          | S1     | CORE LATER                             | 3     |                                  |
| TS-AUTH-005 | Password reset                              | S2     | CORE LATER                             | 3     |                                  |
| TS-AUTH-006 | Email verification                          | S2     | CORE LATER                             | 3     |                                  |
| TS-AUTH-007 | Session management                          | S2     | CORE LATER                             | 3     |                                  |
| TS-AUTH-008 | Role-based access (learner, creator, admin) | S2     | CORE LATER                             | 3     |                                  |
| TS-AUTH-009 | OAuth/social login                          | S2     | DEFERRED                               | —     | Provider and UX decision pending |
| TS-AUTH-010 | Guest access / guest links                  | S1     | CORE LATER                             | 5     | See TS-GUEST                     |

## TS-COMM: Community System

| ID          | Requirement                          | Source | Classification    | Phase | Notes                                                                                                                     |
| ----------- | ------------------------------------ | ------ | ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| TS-COMM-001 | Community feed                       | S1     | CORE NOW (design) | 1–2   |                                                                                                                           |
| TS-COMM-002 | Posts                                | S1     | CORE NOW (design) | 1–2   |                                                                                                                           |
| TS-COMM-003 | Comments                             | S1     | CORE NOW (design) | 1–2   |                                                                                                                           |
| TS-COMM-004 | Likes/reactions                      | S1     | CORE NOW (design) | 1–2   |                                                                                                                           |
| TS-COMM-005 | Unresolved interaction type ("tha…") | S1     | NEEDS DECISION    | —     | See `docs/OPEN-PRODUCT-DECISIONS.md` OPD-001. Original transcription: "post, comment, likes, tha". Do NOT invent meaning. |
| TS-COMM-006 | Community membership                 | S1     | CORE NOW (design) | 1–2   |                                                                                                                           |
| TS-COMM-007 | Community discovery                  | S1     | CORE NOW (design) | 1–2   |                                                                                                                           |
| TS-COMM-008 | Community moderation                 | S1     | CORE LATER        | 5     |                                                                                                                           |
| TS-COMM-009 | Content reporting                    | S1     | CORE LATER        | 5     |                                                                                                                           |
| TS-COMM-010 | Community notifications              | S1     | CORE LATER        | 4     |                                                                                                                           |
| TS-COMM-011 | Creator/community administration     | S1     | CORE NOW (design) | 1–2   |                                                                                                                           |
| TS-COMM-012 | Community categories/topics          | S2     | CORE NOW (design) | 1–2   |                                                                                                                           |
| TS-COMM-013 | Pinned/featured posts                | S2     | CORE LATER        | 5     |                                                                                                                           |
| TS-COMM-014 | Rich media in posts                  | S2     | CORE LATER        | 5     |                                                                                                                           |
| TS-COMM-015 | Community rules/guidelines display   | S2     | CORE NOW (design) | 1–2   |                                                                                                                           |

## TS-CLASS: Classroom / Learning System

| ID           | Requirement                                           | Source | Classification                        | Phase | Notes                                               |
| ------------ | ----------------------------------------------------- | ------ | ------------------------------------- | ----- | --------------------------------------------------- |
| TS-CLASS-001 | Courses                                               | S1     | CORE NOW (design)                     | 1–2   |                                                     |
| TS-CLASS-002 | Course structure (modules)                            | S1     | CORE NOW (design)                     | 1–2   |                                                     |
| TS-CLASS-003 | Lessons                                               | S1     | CORE NOW (design)                     | 1–2   |                                                     |
| TS-CLASS-004 | Learning progression                                  | S1     | CORE NOW (design)                     | 1–2   |                                                     |
| TS-CLASS-005 | Classroom experience                                  | S1     | CORE NOW (design)                     | 1–2   |                                                     |
| TS-CLASS-006 | Embedded video content                                | S1     | CORE LATER                            | 6     | Provider-abstracted (YouTube/Vimeo historical refs) |
| TS-CLASS-007 | Completion tracking                                   | S1     | CORE NOW (design) / CORE LATER (real) | 2/3   |                                                     |
| TS-CLASS-008 | Learning states (not started, in progress, completed) | S1     | CORE NOW (design)                     | 1–2   |                                                     |
| TS-CLASS-009 | Practical assignments/projects                        | S1     | CORE LATER                            | 5     |                                                     |
| TS-CLASS-010 | Resources associated with lessons                     | S1     | CORE NOW (design)                     | 1–2   |                                                     |
| TS-CLASS-011 | Certificates                                          | S1     | DEFERRED                              | —     | See OPD-012. Needs product/legal decision           |
| TS-CLASS-012 | Course enrollment                                     | S2     | CORE NOW (design)                     | 1–2   |                                                     |
| TS-CLASS-013 | Course reviews/ratings                                | S2     | CORE LATER                            | 5     |                                                     |
| TS-CLASS-014 | Course prerequisites                                  | S2     | DEFERRED                              | —     |                                                     |
| TS-CLASS-015 | Learning path / curriculum                            | S2     | DEFERRED                              | —     |                                                     |
| TS-CLASS-016 | Code syntax highlighting in lessons                   | S1     | CORE NOW (design)                     | 2     | Reusable content rendering layer                    |
| TS-CLASS-017 | Provider-abstracted video delivery                    | S2     | CORE LATER                            | 6     | Internal adapter, not vendor lock-in                |

## TS-EVENT: Events / Live System

| ID           | Requirement            | Source | Classification    | Phase | Notes                                    |
| ------------ | ---------------------- | ------ | ----------------- | ----- | ---------------------------------------- |
| TS-EVENT-001 | Events                 | S1     | CORE NOW (design) | 1–2   |                                          |
| TS-EVENT-002 | Calendar/scheduling    | S1     | CORE NOW (design) | 1–2   |                                          |
| TS-EVENT-003 | Scheduled sessions     | S1     | CORE NOW (design) | 1–2   |                                          |
| TS-EVENT-004 | Live sessions          | S1     | CORE LATER        | 6     | Provider adapter required                |
| TS-EVENT-005 | Event pages            | S1     | CORE NOW (design) | 1–2   |                                          |
| TS-EVENT-006 | Registration/join flow | S1     | CORE NOW (design) | 1–2   |                                          |
| TS-EVENT-007 | Attendance tracking    | S1     | CORE LATER        | 5     |                                          |
| TS-EVENT-008 | Reminder/notification  | S1     | CORE LATER        | 4     |                                          |
| TS-EVENT-009 | External meeting links | S1     | CORE LATER        | 5     | Zoom/Google Meet historical refs         |
| TS-EVENT-010 | Live provider failover | S2     | CORE LATER        | 6     | Session-level, not mid-session (ADR-018) |
| TS-EVENT-011 | Recording/replay       | S2     | DEFERRED          | —     | Provider capability dependent            |

## TS-GAME: Gamification

| ID          | Requirement                   | Source | Classification    | Phase | Notes                                          |
| ----------- | ----------------------------- | ------ | ----------------- | ----- | ---------------------------------------------- |
| TS-GAME-001 | Points system                 | S1     | CORE LATER        | 5     | Connected to learning/participation            |
| TS-GAME-002 | Progress tracking (visual)    | S1     | CORE NOW (design) | 1–2   |                                                |
| TS-GAME-003 | Streaks                       | S1     | NEEDS DECISION    | —     | See OPD-005. Must be justified, not decorative |
| TS-GAME-004 | Milestones                    | S1     | CORE LATER        | 5     |                                                |
| TS-GAME-005 | Badges                        | S1     | CORE LATER        | 5     |                                                |
| TS-GAME-006 | Challenges                    | S1     | DEFERRED          | —     |                                                |
| TS-GAME-007 | Completion states             | S1     | CORE NOW (design) | 1–2   |                                                |
| TS-GAME-008 | Creator/community recognition | S1     | CORE LATER        | 5     |                                                |
| TS-GAME-009 | Leaderboards                  | S2     | NEEDS DECISION    | —     | See OPD-011. Privacy/motivation tradeoff       |

## TS-PAY: Payments

| ID         | Requirement                        | Source | Classification | Phase | Notes                                          |
| ---------- | ---------------------------------- | ------ | -------------- | ----- | ---------------------------------------------- |
| TS-PAY-001 | Customer checkout                  | S1     | CORE LATER     | 7     | Paystack/Flutterwave historical refs           |
| TS-PAY-002 | Subscriptions/memberships          | S1     | CORE LATER     | 7     |                                                |
| TS-PAY-003 | One-time purchases                 | S1     | CORE LATER     | 7     |                                                |
| TS-PAY-004 | Inline payment experience          | S1     | CORE LATER     | 7     |                                                |
| TS-PAY-005 | Split payments (marketplace)       | S1     | CORE LATER     | 8     |                                                |
| TS-PAY-006 | Creator payouts                    | S1     | CORE LATER     | 8     | See TS-PAYOUT                                  |
| TS-PAY-007 | Payment verification               | S2     | CORE LATER     | 7     |                                                |
| TS-PAY-008 | Webhook processing                 | S2     | CORE LATER     | 7     | Idempotent                                     |
| TS-PAY-009 | Failed payments                    | S2     | CORE LATER     | 7     |                                                |
| TS-PAY-010 | Refunds                            | S2     | CORE LATER     | 7     |                                                |
| TS-PAY-011 | Disputes/chargebacks               | S2     | CORE LATER     | 7     |                                                |
| TS-PAY-012 | Transaction history                | S2     | CORE LATER     | 7     |                                                |
| TS-PAY-013 | "Instant Payouts (SMS + 1%, GH 1)" | S1     | NEEDS DECISION | —     | See OPD-002. Original wording unclear.         |
| TS-PAY-014 | Unresolved payment phrase          | S1     | NEEDS DECISION | —     | See OPD-003. Partially unreadable.             |
| TS-PAY-015 | Ghana payment model                | S2     | NEEDS DECISION | —     | See OPD-013. Must be documented before Phase 7 |
| TS-PAY-016 | International payment model        | S2     | NEEDS DECISION | —     | See OPD-014                                    |

## TS-PAYOUT: Creator Payouts

| ID            | Requirement                | Source | Classification | Phase | Notes       |
| ------------- | -------------------------- | ------ | -------------- | ----- | ----------- |
| TS-PAYOUT-001 | Gross transaction tracking | S1, S2 | CORE LATER     | 8     |             |
| TS-PAYOUT-002 | Platform fee calculation   | S1, S2 | CORE LATER     | 8     |             |
| TS-PAYOUT-003 | Creator share calculation  | S1, S2 | CORE LATER     | 8     |             |
| TS-PAYOUT-004 | Taxes/adjustments          | S2     | CORE LATER     | 8     |             |
| TS-PAYOUT-005 | Refund/reversal handling   | S2     | CORE LATER     | 8     |             |
| TS-PAYOUT-006 | Pending balance            | S2     | CORE LATER     | 8     |             |
| TS-PAYOUT-007 | Available balance          | S2     | CORE LATER     | 8     |             |
| TS-PAYOUT-008 | Payout history             | S2     | CORE LATER     | 8     |             |
| TS-PAYOUT-009 | Payout status tracking     | S2     | CORE LATER     | 8     |             |
| TS-PAYOUT-010 | Reconciliation             | S2     | CORE LATER     | 8     |             |
| TS-PAYOUT-011 | Audit trail                | S2     | CORE LATER     | 8     |             |
| TS-PAYOUT-012 | Revenue split policy       | S1     | NEEDS DECISION | —     | See OPD-004 |

## TS-FILE: File Hosting & Storage

| ID          | Requirement                          | Source | Classification | Phase | Notes   |
| ----------- | ------------------------------------ | ------ | -------------- | ----- | ------- |
| TS-FILE-001 | PDF hosting                          | S1     | CORE LATER     | 4     |         |
| TS-FILE-002 | Downloadable resources               | S1     | CORE LATER     | 4     |         |
| TS-FILE-003 | Creator asset uploads                | S1     | CORE LATER     | 4     |         |
| TS-FILE-004 | Course resources                     | S1     | CORE LATER     | 4     |         |
| TS-FILE-005 | Workflow files                       | S1     | CORE LATER     | 5     |         |
| TS-FILE-006 | Digital product files                | S1     | CORE LATER     | 8     |         |
| TS-FILE-007 | Private/public object classification | S2     | CORE LATER     | 4     |         |
| TS-FILE-008 | Owner/resource relationships         | S2     | CORE LATER     | 4     |         |
| TS-FILE-009 | Signed access URLs                   | S2     | CORE LATER     | 4     |         |
| TS-FILE-010 | Controlled uploads                   | S2     | CORE LATER     | 4     |         |
| TS-FILE-011 | Quota tracking                       | S2     | CORE LATER     | 4     |         |
| TS-FILE-012 | Storage usage tracking               | S2     | CORE LATER     | 4     |         |
| TS-FILE-013 | Deletion/lifecycle management        | S2     | CORE LATER     | 4     |         |
| TS-FILE-014 | Auditability                         | S2     | CORE LATER     | 4     |         |
| TS-FILE-015 | R2 storage direction                 | S3     | CORE LATER     | 4     | ADR-009 |

## TS-MKT: Marketplace

| ID         | Requirement                     | Source | Classification | Phase | Notes |
| ---------- | ------------------------------- | ------ | -------------- | ----- | ----- |
| TS-MKT-001 | Digital product listings        | S1     | CORE LATER     | 8     |       |
| TS-MKT-002 | Workflow/template sales         | S1     | CORE LATER     | 8     |       |
| TS-MKT-003 | Creator product pages           | S1     | CORE LATER     | 8     |       |
| TS-MKT-004 | Purchase entitlements           | S1     | CORE LATER     | 8     |       |
| TS-MKT-005 | Protected downloads             | S1     | CORE LATER     | 8     |       |
| TS-MKT-006 | Product reviews                 | S2     | CORE LATER     | 8     |       |
| TS-MKT-007 | Marketplace moderation          | S2     | CORE LATER     | 8     |       |
| TS-MKT-008 | Creator analytics (marketplace) | S2     | CORE LATER     | 8     |       |
| TS-MKT-009 | Marketplace splits/settlement   | S1     | CORE LATER     | 8     |       |

## TS-AI: AI Workspace & Capabilities

| ID        | Requirement                   | Source | Classification | Phase | Notes                                                                     |
| --------- | ----------------------------- | ------ | -------------- | ----- | ------------------------------------------------------------------------- |
| TS-AI-001 | General platform assistant    | S1     | CORE LATER     | 9     | "AI Workspace (general platform)" from source. GPT-4o mini ref is LEGACY. |
| TS-AI-002 | Contextual learning assistant | S2     | CORE LATER     | 9     |                                                                           |
| TS-AI-003 | Search augmentation           | S2     | CORE LATER     | 9     |                                                                           |
| TS-AI-004 | Recommendations               | S2     | CORE LATER     | 9     |                                                                           |
| TS-AI-005 | Knowledge retrieval           | S2     | CORE LATER     | 9     |                                                                           |
| TS-AI-006 | Workflow assistance           | S2     | CORE LATER     | 9     |                                                                           |
| TS-AI-007 | Content assistance (creator)  | S2     | CORE LATER     | 9     |                                                                           |
| TS-AI-008 | Provider-agnostic AI layer    | S2     | CORE LATER     | 9     | No vendor lock-in                                                         |
| TS-AI-009 | AI privacy controls           | S2     | CORE LATER     | 9     | See SECURITY-RULES                                                        |

## TS-REF: Referrals & Affiliates

| ID         | Requirement                    | Source | Classification    | Phase | Notes                                                  |
| ---------- | ------------------------------ | ------ | ----------------- | ----- | ------------------------------------------------------ |
| TS-REF-001 | Referral links                 | S1     | CORE LATER        | 5     |                                                        |
| TS-REF-002 | Referral attribution           | S1     | CORE LATER        | 5     |                                                        |
| TS-REF-003 | Qualification rules            | S2     | CORE LATER        | 5     | PENDING → QUALIFIED → CREDITED                         |
| TS-REF-004 | Reward/entitlement system      | S1     | CORE LATER        | 5     | Platform entitlements, NOT provider capacity (ADR-014) |
| TS-REF-005 | Anti-abuse controls            | S2     | CORE LATER        | 5     |                                                        |
| TS-REF-006 | Admin visibility               | S2     | CORE LATER        | 5     |                                                        |
| TS-REF-007 | Creator visibility / dashboard | S1     | CORE NOW (design) | 1–2   | Fixture data in frontend                               |
| TS-REF-008 | Custom affiliate programs      | S1     | DEFERRED          | —     |                                                        |
| TS-REF-009 | Referral abuse reversal        | S2     | CORE LATER        | 5     |                                                        |
| TS-REF-010 | Referral milestone states      | S2     | CORE NOW (design) | 1–2   |                                                        |

## TS-DM: Private Messaging

| ID        | Requirement                   | Source | Classification | Phase | Notes                               |
| --------- | ----------------------------- | ------ | -------------- | ----- | ----------------------------------- |
| TS-DM-001 | User-to-user messaging        | S1     | CORE LATER     | 5     |                                     |
| TS-DM-002 | Creator/student communication | S1     | CORE LATER     | 5     |                                     |
| TS-DM-003 | Message moderation            | S2     | CORE LATER     | 5     |                                     |
| TS-DM-004 | Blocking/reporting            | S2     | CORE LATER     | 5     |                                     |
| TS-DM-005 | Notification controls         | S2     | CORE LATER     | 5     |                                     |
| TS-DM-006 | Abuse prevention              | S2     | CORE LATER     | 5     |                                     |
| TS-DM-007 | Auto-DM onboarding sequences  | S1     | DEFERRED       | —     | See OPD-007. Must be consent-based. |

## TS-GUEST: Guest Access

| ID           | Requirement                 | Source | Classification    | Phase | Notes                             |
| ------------ | --------------------------- | ------ | ----------------- | ----- | --------------------------------- |
| TS-GUEST-001 | Guest links for non-members | S1     | CORE LATER        | 5     |                                   |
| TS-GUEST-002 | Creator/course previews     | S1     | CORE NOW (design) | 1–2   | Public pages serve this partially |
| TS-GUEST-003 | Community invitations       | S1     | CORE LATER        | 5     |                                   |
| TS-GUEST-004 | Access boundary enforcement | S2     | CORE LATER        | 5     | Must not expose private content   |

## TS-DISC: Discovery & Navigation

| ID          | Requirement                       | Source | Classification    | Phase | Notes                                  |
| ----------- | --------------------------------- | ------ | ----------------- | ----- | -------------------------------------- |
| TS-DISC-001 | Public explore/discovery          | S1     | CORE NOW          | 1–2   |                                        |
| TS-DISC-002 | Category pages                    | S1     | CORE NOW          | 1–2   | Data-driven taxonomy                   |
| TS-DISC-003 | Authenticated home/explore        | S1     | CORE NOW          | 1–2   | Separate from public landing (ADR-004) |
| TS-DISC-004 | Search (basic)                    | S2     | CORE LATER        | 3     | Postgres first (ADR-011)               |
| TS-DISC-005 | Search (AI-augmented)             | S2     | CORE LATER        | 9     |                                        |
| TS-DISC-006 | Recommendations                   | S2     | CORE LATER        | 9     |                                        |
| TS-DISC-007 | Creator/teacher profiles (public) | S1     | CORE NOW (design) | 1–2   |                                        |

## TS-LAND: Public Landing & Marketing

| ID          | Requirement            | Source | Classification    | Phase | Notes                             |
| ----------- | ---------------------- | ------ | ----------------- | ----- | --------------------------------- |
| TS-LAND-001 | Marketing landing page | S1     | CORE NOW          | 1–2   | Separate from auth home (ADR-004) |
| TS-LAND-002 | Pricing page           | S2     | CORE NOW (design) | 1–2   | Placeholder/future content        |
| TS-LAND-003 | Become a Teacher page  | S2     | CORE NOW (design) | 1–2   |                                   |
| TS-LAND-004 | About page             | S2     | CORE NOW (design) | 1–2   |                                   |
| TS-LAND-005 | Help/support page      | S2     | CORE NOW (design) | 1–2   |                                   |
| TS-LAND-006 | Legal pages            | S2     | CORE LATER        | 3     |                                   |
| TS-LAND-007 | SEO for public pages   | S2     | CORE NOW (design) | 2     |                                   |

## TS-TEACH: Teacher/Creator Workspace

| ID           | Requirement                | Source | Classification                        | Phase | Notes        |
| ------------ | -------------------------- | ------ | ------------------------------------- | ----- | ------------ |
| TS-TEACH-001 | Creator overview dashboard | S1     | CORE NOW (design)                     | 1–2   |              |
| TS-TEACH-002 | Course builder             | S1     | CORE NOW (design) / CORE LATER (real) | 1–2/5 |              |
| TS-TEACH-003 | Lesson builder             | S1     | CORE NOW (design) / CORE LATER (real) | 1–2/5 |              |
| TS-TEACH-004 | Live session management    | S1     | CORE LATER                            | 6     |              |
| TS-TEACH-005 | Product publishing         | S1     | CORE LATER                            | 8     |              |
| TS-TEACH-006 | Community management       | S1     | CORE LATER                            | 5     |              |
| TS-TEACH-007 | Student/audience view      | S1     | CORE NOW (design)                     | 1–2   |              |
| TS-TEACH-008 | Reviews management         | S2     | CORE LATER                            | 5     |              |
| TS-TEACH-009 | Earnings dashboard         | S1     | CORE NOW (design)                     | 1–2   | Fixture data |
| TS-TEACH-010 | Analytics dashboard        | S1     | CORE NOW (design)                     | 1–2   | Fixture data |
| TS-TEACH-011 | Creator settings           | S2     | CORE NOW (design)                     | 1–2   |              |
| TS-TEACH-012 | Teacher application flow   | S2     | CORE LATER                            | 5     |              |
| TS-TEACH-013 | Teacher approval process   | S2     | CORE LATER                            | 5     |              |

## TS-ADMIN: Admin Workspace

| ID           | Requirement                | Source | Classification    | Phase | Notes        |
| ------------ | -------------------------- | ------ | ----------------- | ----- | ------------ |
| TS-ADMIN-001 | Admin overview             | S2     | CORE NOW (design) | 1–2   |              |
| TS-ADMIN-002 | User management            | S2     | CORE LATER        | 3     |              |
| TS-ADMIN-003 | Teacher/creator management | S2     | CORE LATER        | 5     |              |
| TS-ADMIN-004 | Category management        | S2     | CORE LATER        | 3     |              |
| TS-ADMIN-005 | Content management         | S2     | CORE LATER        | 5     |              |
| TS-ADMIN-006 | Reports/moderation         | S2     | CORE LATER        | 5     |              |
| TS-ADMIN-007 | Payment administration     | S2     | CORE LATER        | 7     |              |
| TS-ADMIN-008 | Payout administration      | S2     | CORE LATER        | 8     |              |
| TS-ADMIN-009 | Policy management          | S2     | CORE LATER        | 5     |              |
| TS-ADMIN-010 | Referral/entitlement admin | S2     | CORE LATER        | 5     |              |
| TS-ADMIN-011 | Provider usage monitoring  | S2     | CORE LATER        | 6     |              |
| TS-ADMIN-012 | Analytics                  | S2     | CORE NOW (design) | 1–2   | Fixture data |
| TS-ADMIN-013 | System settings            | S2     | CORE LATER        | 3     |              |

## TS-NOTIFY: Notifications

| ID            | Requirement              | Source | Classification    | Phase | Notes            |
| ------------- | ------------------------ | ------ | ----------------- | ----- | ---------------- |
| TS-NOTIFY-001 | In-app notifications     | S2     | CORE NOW (design) | 1–2   |                  |
| TS-NOTIFY-002 | Notification preferences | S2     | CORE LATER        | 4     |                  |
| TS-NOTIFY-003 | Push notifications (PWA) | S2     | CORE LATER        | 4     | Consent required |
| TS-NOTIFY-004 | Email notifications      | S2     | CORE LATER        | 4     | Via Resend       |
| TS-NOTIFY-005 | Notification center UI   | S2     | CORE NOW (design) | 1–2   |                  |

## TS-ONBOARD: Onboarding

| ID             | Requirement                   | Source | Classification    | Phase | Notes |
| -------------- | ----------------------------- | ------ | ----------------- | ----- | ----- |
| TS-ONBOARD-001 | User onboarding flow          | S2     | CORE NOW (design) | 1–2   |       |
| TS-ONBOARD-002 | Creator onboarding flow       | S2     | CORE NOW (design) | 1–2   |       |
| TS-ONBOARD-003 | Interest/preference selection | S2     | CORE NOW (design) | 1–2   |       |

## TS-WORK: Workflows & Resources

| ID          | Requirement          | Source | Classification    | Phase | Notes |
| ----------- | -------------------- | ------ | ----------------- | ----- | ----- |
| TS-WORK-001 | Workflow library     | S1     | CORE NOW (design) | 1–2   |       |
| TS-WORK-002 | Resource library     | S1     | CORE NOW (design) | 1–2   |       |
| TS-WORK-003 | Workflow publishing  | S1     | CORE LATER        | 5     |       |
| TS-WORK-004 | Template marketplace | S1     | CORE LATER        | 8     |       |

## TS-TENANT: Multi-tenancy / Organizations

| ID            | Requirement                | Source | Classification | Phase | Notes                       |
| ------------- | -------------------------- | ------ | -------------- | ----- | --------------------------- |
| TS-TENANT-001 | Organizations              | S1     | CORE LATER     | 10    | Architecture must not block |
| TS-TENANT-002 | Private academies          | S1     | CORE LATER     | 10    |                             |
| TS-TENANT-003 | Creator-owned spaces       | S1     | CORE LATER     | 10    |                             |
| TS-TENANT-004 | Tenant isolation           | S2     | CORE LATER     | 10    |                             |
| TS-TENANT-005 | Tenant-aware authorization | S2     | CORE LATER     | 10    |                             |

## TS-SEC: Security & Access Control

| ID         | Requirement                   | Source | Classification | Phase | Notes                                |
| ---------- | ----------------------------- | ------ | -------------- | ----- | ------------------------------------ |
| TS-SEC-001 | Authenticated access          | S1     | CORE LATER     | 3     |                                      |
| TS-SEC-002 | Object-level authorization    | S2     | CORE LATER     | 3     |                                      |
| TS-SEC-003 | Protected private files       | S1     | CORE LATER     | 4     | Link leak prevention noted in source |
| TS-SEC-004 | Signed/controlled access URLs | S2     | CORE LATER     | 4     |                                      |
| TS-SEC-005 | Creator/member permissions    | S2     | CORE LATER     | 3     |                                      |
| TS-SEC-006 | RLS/database policies         | S2     | CORE LATER     | 3     |                                      |
| TS-SEC-007 | Rate limiting                 | S2     | CORE LATER     | 4     |                                      |
| TS-SEC-008 | Webhook verification          | S2     | CORE LATER     | 7     |                                      |
| TS-SEC-009 | Audit logging                 | S2     | CORE LATER     | 3     |                                      |
| TS-SEC-010 | Input validation              | S2     | CORE LATER     | 3     |                                      |
| TS-SEC-011 | Secure secret management      | S2     | CORE LATER     | 3     | ADR-017                              |

## TS-ADS: Advertising / Sponsorship

| ID         | Requirement                     | Source | Classification | Phase | Notes       |
| ---------- | ------------------------------- | ------ | -------------- | ----- | ----------- |
| TS-ADS-001 | Central homepage advertisements | S1     | NEEDS DECISION | —     | See OPD-006 |
| TS-ADS-002 | Moderation/disclosure rules     | S2     | NEEDS DECISION | —     | See OPD-006 |

## TS-CODE: Code Features

| ID          | Requirement              | Source | Classification | Phase | Notes                            |
| ----------- | ------------------------ | ------ | -------------- | ----- | -------------------------------- |
| TS-CODE-001 | Code syntax highlighting | S1     | CORE NOW       | 2     | Reusable content rendering layer |

## TS-FEED: Feedback / Support

| ID          | Requirement                  | Source | Classification | Phase | Notes                                     |
| ----------- | ---------------------------- | ------ | -------------- | ----- | ----------------------------------------- |
| TS-FEED-001 | Telegram feedback channel    | S1     | CORE LATER     | 4     | Internal/operational, not hard dependency |
| TS-FEED-002 | Replaceable support channels | S2     | CORE LATER     | 4     | Architecture must allow alternatives      |

## TS-MOBILE: Mobile & PWA

| ID            | Requirement                    | Source | Classification | Phase | Notes        |
| ------------- | ------------------------------ | ------ | -------------- | ----- | ------------ |
| TS-MOBILE-001 | Mobile-first design            | S1, S2 | CORE NOW       | 1–2   | ADR-008      |
| TS-MOBILE-002 | PWA installability             | S2     | CORE LATER     | 4     |              |
| TS-MOBILE-003 | Offline/low-bandwidth behavior | S2     | CORE LATER     | 4     |              |
| TS-MOBILE-004 | Web push notifications         | S2     | CORE LATER     | 4     | With consent |

## TS-OPS: Operations & Observability

| ID         | Requirement              | Source | Classification    | Phase | Notes              |
| ---------- | ------------------------ | ------ | ----------------- | ----- | ------------------ |
| TS-OPS-001 | Error handling           | S2     | CORE NOW (design) | 1–2   | Error states in UI |
| TS-OPS-002 | Loading states           | S2     | CORE NOW (design) | 1–2   |                    |
| TS-OPS-003 | Empty states             | S2     | CORE NOW (design) | 1–2   |                    |
| TS-OPS-004 | Feature flags            | S2     | CORE LATER        | 3     |                    |
| TS-OPS-005 | CI/CD                    | S2     | CORE NOW          | 0     | Already configured |
| TS-OPS-006 | Observability/monitoring | S2     | CORE LATER        | 3     |                    |
| TS-OPS-007 | Backup/recovery strategy | S2     | CORE LATER        | 3     |                    |

---

## Traceability

Every requirement flows through:

```
Source → Product Requirement (this file)
  → Design (Phase 1)
  → Frontend Implementation (Phase 2)
  → Backend Implementation (Phase 3+)
  → Testing
  → Release
```

## Change control

When a requirement changes classification, update this file and record the decision in `docs/DECISIONS.md`.

When a new requirement is identified, add it here with the next available ID in the appropriate category.
