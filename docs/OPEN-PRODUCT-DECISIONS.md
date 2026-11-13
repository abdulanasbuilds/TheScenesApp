# The Scenes ï¿½ Open Product Decisions

This document tracks unresolved product and business questions that require human decision before implementation.

Do not invent answers. Record the question, the historical context, and wait for a decision.

## Decision update — 4 November 2026

The founder selected external embedding for launch plans, approved Pro at $19 / GH₵300 and Pro Plus
at $39 / GH₵620, set the Free-plan sales fee at 7%, chose a 1% + GH₵1 instant-withdrawal platform fee
with provider transfer fees passed to the creator, approved Supabase for a local-only Phase 3 proof,
and kept payment-provider selection on hold. Production data-platform approval remains a later gate.
See ADR-029 through ADR-034 in `docs/DECISIONS.md`; those newer records supersede conflicting
historical text below.

---

## RESOLVED DECISIONS

### RES-001 ï¿½ Telegram Use Case ? RESOLVED (2026-10-31)

**Question:** What is the exact use case for Telegram integration?

**Decision:** Telegram is for a **feedback system**. Users can submit feedback from various pages/sections of the application, which passes through to a dedicated Telegram bot. The founder will have access to all feedback submissions.

**Implementation Details:**

- Create a dedicated Telegram bot
- Connect bot to The Scenes application
- Identify pages/sections where feedback widget appears
- Pass user feedback + context (page, user ID, timestamp) to bot
- Founder receives feedback in Telegram channel

**Affected Architecture:** TS-FEED-001, feedback widget component, Telegram bot integration (Phase 4)

**Status:** ? RESOLVED ï¿½ Document implementation in Phase 4

---

### RES-002 ï¿½ Pricing Tiers ? RESOLVED (2026-10-31)

> **Superseded in part on 4 November 2026:** ADR-029 removes native video/file/live hosting and the
> 300 GB / 1 TB allowances from the launch plans. ADR-030 approves the paid-plan prices. The text
> below is retained only as historical context.

**Question:** What are the pricing tiers and feature gates?

**Decision:** Three tiers with strict feature gates:

**FREE PLAN:**

- 1 community group workspace only
- 100 members maximum
- NO native video hosting (external embedding only: YouTube, Vimeo)
- NO native file hosting (external embedding only: Google Docs, Dropbox)
- External event links only (no native live streaming)
- Standard automated payouts (not instant)

**PRO PLAN:**

- Unlimited community groups
- Unlimited members
- Native video + file hosting
- 300 GB unified storage
- Native interactive live streaming
- Automated replay
- Rich text/document editor
- AI thread summaries
- Instant withdrawals
- International sales routes
- AI co-pilot features (Phase 9)
- 3% platform fee on sales

**PRO PLUS PLAN:**

- All Pro features
- 1 TB unified storage
- Advanced AI features
- Priority support
- 3% platform fee on sales

**Critical Rules:**

- Transaction fees passed to users (NOT absorbed by platform)
- Platform keeps 100% of 3% fee
- Minimum 70% profit margin required on paid plans
- Final pricing TBD after cost research

**Affected Architecture:** TS-AUTH, plan-based feature gates across all modules, quota enforcement

**Status:** ? RESOLVED ï¿½ See PRICING-MONETIZATION.md for full details

---

### RES-003 ï¿½ Transaction Fee Model ? RESOLVED (2026-10-31)

**Question:** Who pays payment processor transaction fees?

**Decision:** **Users pay transaction fees, NOT the platform.**

**Example:**

- Course costs \
- Platform fee: 3% = \
- Transaction fee: 2.9% + \.30 = \.20
- User pays: \.20
- Platform receives: \
- Creator receives: \

**Rationale:** This is standard for marketplaces (Gumroad, Stripe billing) and ensures platform keeps 100% of its 3% fee.

**Affected Architecture:** TS-PAY, checkout flow, pricing display, fee calculations

**Status:** ? RESOLVED ï¿½ Implement in Phase 7

---

### RES-004 ï¿½ Platform Fee Percentage ? RESOLVED (2026-10-31)

**Question:** What is the platform fee on sales?

**Decision:** **3% on all sales** (Pro and Pro Plus plans)

**Rationale:**

- Lower than Teachable Basic (5%)
- Lower than Thinkific Free (10%)
- Competitive with Gumroad (~10%)
- Higher than Skool/Circle (0%, but they have subscription fees)
- Allows platform to be sustainable while creator-friendly

**Affected Architecture:** TS-PAY, TS-PAYOUT, creator earnings calculations

**Status:** ? RESOLVED ï¿½ Implement in Phase 7

---

## UNRESOLVED DECISIONS (REQUIRE FOUNDER INPUT)

### OPD-015 ï¿½ Pricing Cost Research ?? CRITICAL

**Update (4 November 2026):** Paid-plan prices, the external-hosting model and the exact 7% Free-plan
fee are approved, but the cost evidence must be refreshed and consolidated before payments. See
ADR-029–030.

**Question:** What are the exact infrastructure costs, and what pricing achieves 70% margin?

**Why it matters:** MANDATORY before setting final prices. Cannot implement Phase 7 without this.

**Research Required:**

1. Cloudflare R2 costs (storage, requests, egress)
2. Live streaming costs (Bunny.net, LiveKit, Daily, Agora)
3. Supabase costs (database, storage, bandwidth)
4. Resend costs (email volume per user)
5. Redis costs (rate limiting)
6. AI costs (Phase 9: OpenAI, Anthropic, vector storage)
7. Payment processing fees (Paystack, Stripe)
8. Per-user cost estimate
9. Competitive pricing analysis (Skool, Circle, Kajabi, Teachable)
10. African market willingness-to-pay research

**Formula:**
\\\
Monthly Price = (Infrastructure Cost / 0.30) to achieve 70% margin
\\\

**Deliverable:** PRICING-COST-RESEARCH.md with:

- Detailed cost breakdown
- Per-user monthly cost
- Recommended pricing (USD and GHS)
- Margin validation
- Competitive positioning

**Affected Architecture:** All pricing implementation, quota limits, storage allocation

**Status:** ?? BLOCKED ï¿½ Agent must research before Phase 7

---

## ORIGINAL OPEN DECISIONS (Still Unresolved)

### OPD-001 ï¿½ Unresolved community interaction type

**Question:** What is the community interaction referenced as "thaï¿½" in the original product notes?

**Historical wording:** "post, comment, likes, tha"

**Why it matters:** The community system needs a complete interaction model. If there is a fourth interaction type beyond posts, comments, and likes, it affects the data model, UI, and community engagement design.

**Affected architecture:** TS-COMM-005, community data model, community UI, notification system

**Current assumption:** The community supports posts, comments, and likes/reactions. No fourth interaction type is implemented until clarified.

**Possible interpretations:**

- "thanks" ï¿½ a gratitude/appreciation reaction
- "threads" ï¿½ threaded discussions
- "that" ï¿½ incomplete thought, no additional feature
- Something else entirely

**Decision required:** Clarify the intended fourth community interaction type, or confirm that posts/comments/likes are sufficient for launch.

**Status:** WAITING FOR FOUNDER INPUT

---

### OPD-002 ï¿½ Instant Payouts business rule

**Update (4 November 2026):** The business direction is resolved as a 1% + GH₵1 platform fee, with
the selected payment provider's transfer fee passed to the creator. Payment-provider selection and
implementation remain on hold, and current provider terms must be revalidated before Phase 7. See
ADR-031 and ADR-034.

**Question:** What exactly does "Instant Payouts (SMS + 1%, GH 1)" mean?

**Historical wording:** "Instant Payouts (SMS + 1%, GH 1)"

**Why it matters:** This appears to define a payout fee structure and method. The exact business rule affects the creator payout system, fee calculations, and payment provider requirements.

**Affected architecture:** TS-PAY-013, TS-PAYOUT, payment provider selection, creator earnings calculations

**Current assumption:** Instant payouts are enabled for Pro and Pro Plus plans. Standard payouts for Free plan.

**Possible interpretations:**

- SMS notification on payout + 1% processing fee, GH?1 minimum
- SMS-based payout trigger + 1% fee, Ghana-specific rule
- Instant payout via mobile money with 1% fee and GH?1 floor

**Decision required:** Before implementation, confirm supported methods and regional/provider rules.

**Status:** BUSINESS FEE RULE RESOLVED; PROVIDER/IMPLEMENTATION DEFERRED

---

### OPD-003 ï¿½ Incomplete payment-provider phrase

**Question:** What was the complete payment-related phrase that was partially unreadable in the original notes?

**Historical wording:** [Partially unreadable ï¿½ original transcription incomplete]

**Why it matters:** May contain a business rule, provider requirement, or pricing constraint that affects the payment architecture.

**Affected architecture:** TS-PAY, payment provider selection

**Current assumption:** Payment architecture is designed to be provider-flexible. No specific constraint from this phrase is enforced.

**Decision required:** Locate the original notes and clarify the complete phrase, or confirm it can be disregarded.

**Status:** WAITING FOR FOUNDER INPUT

---

### OPD-004 ï¿½ Marketplace revenue split (PARTIALLY RESOLVED)

**Question:** What is the platform's revenue split policy for marketplace transactions?

**Historical wording:** References to "marketplace splits" and "creator payouts" exist in the original notes, but the exact percentage/formula is not specified.

**Why it matters:** The creator payout system, marketplace pricing, and creator economics all depend on the split policy. The platform fee directly affects creator attractiveness and platform revenue.

**Affected architecture:** TS-PAYOUT-012, TS-MKT-009, TS-PAYOUT-002, creator earnings dashboard

**Current assumption:** 3% platform fee on all sales (RESOLVED for course sales). **Question remains:** Does marketplace (digital products, workflows, templates) use the same 3%, or different?

**Decision required:** Confirm marketplace uses same 3% fee, or define different split for digital products vs courses.

**Status:** PARTIALLY RESOLVED ï¿½ Confirm marketplace fee matches course fee (3%)

---

OPD-005 through OPD-014 were never written up in this file. Their topics and current handling are
traceable through `docs/PRODUCT-REQUIREMENTS.md` and `docs/FEATURE-MATRIX.md` (for example: learning
streaks are blocked pending the founder decision referenced as OPD-005, and auto-DM onboarding is
deferred as OPD-007). Do not treat these decisions as resolved. Completing their records is accepted
documentation work; it is not a blocker for the current phase. See `docs/PROJECT-STATUS.md` and
ADR-046 for the current working mode.
