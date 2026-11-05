# The Scenes � Pricing & Monetization Strategy (CORRECTED)

> **Decision update — 4 November 2026:** ADR-029 confirms external embedding only for launch base
> plans. ADR-030 approves Pro at $19 / GH₵300, Pro Plus at $39 / GH₵620 and a 7% Free-plan sales fee.
> Where older text below conflicts,
> `docs/DECISIONS.md` is authoritative. A refreshed single cost model is still required before Phase 7.

## CRITICAL BUSINESS RULE

**Minimum Profit Margin:** 70% on all paid plans

Before finalizing any pricing, agents MUST conduct deep cost research on:

- Infrastructure costs (Supabase, R2, Resend, Redis, etc.)
- Payment processing fees (passed to users, NOT absorbed by platform)
- Support costs
- Operational overhead

**NO NATIVE HOSTING BY DEFAULT** � All plans use external embedding for video/files/live

---

## PRICING TIERS (CORRECTED)

### Free Plan

**Community:**

- ? 1 community group workspace (LIMIT: cannot create multiple)
- ? Up to 100 members total across all spaces
- ? Standard member directories
- ? Standard engagement tools
- ? Community links

**Courses:**

- ? URL embedding for video (YouTube, Vimeo, external providers)
- ? URL embedding for files (Google Docs, Dropbox, external links)
- ? Basic course structure

**Events:**

- ? External event links (Zoom, Google Meet, etc.)
- ? Calendar functionality
- ? Event pages

**Payouts:**

- ? Standard automated system payouts
- ? NO instant withdrawals
- ?? Standard settlement timing

**Gamification:**

- ? Standard points/levels

**Support:**

- ? Community support

**Platform Fee:**

- TBD% on sales (research required)

---

### Pro Plan

**Community:**

- ? Unlimited community groups
- ? Unlimited members
- ? Rich text editor
- ? Native document editor
- ? AI thread summaries

**Courses:**

- ? Unlimited courses
- ? Unlimited modules/lessons
- ? URL embedding for video (YouTube, Vimeo, external providers)
- ? URL embedding for files (Google Docs, Dropbox, external links)
- ? NO native video hosting (by default)
- ? NO native file hosting (by default)
- ?? Native hosting may be available as add-on (TBD)

**Events:**

- ? External event links (Zoom, Google Meet, etc.)
- ? NO native live streaming (by default)
- ?? Native live may be available as add-on (TBD)

**Gamification:**

- ? Unlimited custom levels
- ? Custom rewards
- ? Lock classroom access by level

**Payouts:**

- ? Standard automated payouts
- ? Instant withdrawals **WITH FEES** (not free)
- ? International sales routes

**AI Features:**

- ? AI co-pilot features (Phase 9+)

**Platform Fee:**

- ? 3% on all sales (CONFIRMED)
- ? Transaction fees passed to user (NOT absorbed by platform)

**Monthly Cost:**

- TBD USD/GHS (research required for 70% margin)

---

### Pro Plus Plan

**Community:**

- ? All Pro features
- ? Enhanced AI capabilities

**Courses:**

- ? All Pro features
- ? URL embedding for video (YouTube, Vimeo, external providers)
- ? URL embedding for files (Google Docs, Dropbox, external links)
- ? NO native video hosting (by default)
- ? NO native file hosting (by default)
- ?? Native hosting may be available as add-on (TBD)

**Events:**

- ? All Pro features
- ? External event links
- ? NO native live streaming (by default)
- ?? Native live may be available as add-on (TBD)

**Payouts:**

- ? All Pro features
- ? Instant withdrawals **WITH FEES** (not free)
- ? Priority payout processing

**AI Features:**

- ? Advanced AI co-pilot features (Phase 9+)

**Platform Fee:**

- ? 3% on all sales (CONFIRMED)
- ? Transaction fees passed to user (NOT absorbed by platform)

**Monthly Cost:**

- TBD USD/GHS (research required for 70% margin)

---

## FEATURE GATE MATRIX (CORRECTED)

| Feature                                | Free       | Pro            | Pro Plus               |
| -------------------------------------- | ---------- | -------------- | ---------------------- |
| **Community Groups**                   | 1 only     | Unlimited      | Unlimited              |
| **Total Members**                      | 100 max    | Unlimited      | Unlimited              |
| **Video Embedding (YouTube, Vimeo)**   | ? Yes      | ? Yes          | ? Yes                  |
| **File Embedding (Google Docs, etc.)** | ? Yes      | ? Yes          | ? Yes                  |
| **External Live Links (Zoom, Meet)**   | ? Yes      | ? Yes          | ? Yes                  |
| **Native Video Hosting**               | ? No       | ? No (add-on?) | ? No (add-on?)         |
| **Native File Hosting**                | ? No       | ? No (add-on?) | ? No (add-on?)         |
| **Native Live Streaming**              | ? No       | ? No (add-on?) | ? No (add-on?)         |
| **Rich Text Editor**                   | ?          | ? Yes          | ? Yes                  |
| **AI Thread Summaries**                | ?          | ? Yes          | ? Yes                  |
| **AI Co-pilot**                        | ?          | ? Basic        | ? Advanced             |
| **Instant Withdrawals**                | ? No       | ? With fees    | ? With fees (priority) |
| **Custom Levels/Rewards**              | ? Standard | ? Unlimited    | ? Unlimited            |
| **Platform Fee**                       | TBD%       | 3%             | 3%                     |
| **Transaction Fees**                   | User pays  | User pays      | User pays              |
| **Support**                            | Community  | Priority       | Premium                |

---

## CRITICAL CLARIFICATIONS

### 1. No Native Hosting by Default

**ALL PLANS use external embedding:**

- Video: YouTube, Vimeo, Wistia, Loom, etc.
- Files: Google Docs, Dropbox, OneDrive, etc.
- Live: Zoom, Google Meet, external streaming services

**Why this matters:**

- ? Dramatically reduces infrastructure costs
- ? No storage/bandwidth costs for video/files
- ? No live streaming provider costs
- ? Easier to achieve 70% margin
- ? Users already have these accounts
- ? Platform focuses on learning/community, not hosting

**Possible Future Add-on:**

- Native hosting could be offered as paid add-on
- "Native Hosting Pack" � $X/month extra
- Includes: R2 storage, Bunny.net video, native live
- Requires separate cost research

### 2. Instant Withdrawals Have Fees

**Current understanding:**

- Standard payouts: Free, but slower (3-5 business days?)
- Instant payouts: Available on Pro/Pro Plus **BUT users pay fee**

**Example (hypothetical):**

```
Creator has $100 available balance

Standard Payout (Free):
- Fee: $0
- Receives: $100
- Time: 3-5 business days

Instant Payout (Pro/Pro Plus):
- Fee: $1 + 1% = $2
- Receives: $98
- Time: Minutes/hours
```

**OPEN QUESTION (OPD-002 STILL UNRESOLVED):**
What is the exact instant payout fee structure?

- "SMS + 1%, GH 1" � needs clarification
- Is it: SMS notification + 1% fee + GH?1 minimum?
- Or: 1% fee with GH?1 floor?
- Who charges this fee? Paystack? Platform? Both?

---

## REVISED COST STRUCTURE

### What Costs Money (Infrastructure)

**Supabase (Auth + Database):**

- Free tier: 500 MB database, 1 GB storage
- Likely sufficient for many users on Free plan
- Pro plan if needed: $25/month (shared across users)

**Cloudflare R2 (ONLY if native hosting add-on):**

- Not used by default
- Only costs if user buys native hosting add-on

**Resend (Email):**

- Free tier: 3,000 emails/month
- Pay if exceed: $20/month for 50,000 emails
- Cost per user depends on notification frequency

**Redis (Rate Limiting):**

- Upstash free tier: 10,000 commands/day
- Paid: $0.20 per 100K commands
- Minimal cost

**AI Features (Phase 9):**

- Only for Pro/Pro Plus
- Cost per API call (OpenAI/Anthropic)
- Must track usage and enforce quotas

**Payment Processing:**

- Paystack/Stripe fees: Passed to user
- Platform keeps 0% of transaction fees

**Platform Revenue:**

- 3% of all sales
- $0 monthly subscription from free users
- $X/month from Pro users
- $Y/month from Pro Plus users

### What DOESN'T Cost Money

- ? Video hosting (users embed from YouTube/Vimeo)
- ? File hosting (users embed from Google Docs/Dropbox)
- ? Live streaming (users link to Zoom/Meet)
- ? Bandwidth for video (served by external providers)
- ? Storage for files (stored by external providers)

**This dramatically reduces infrastructure costs and makes 70% margin much easier to achieve!**

---

## REVISED COST CALCULATION

### Per-User Cost Estimate (Pro Plan)

```
Supabase allocation: $0.50/month (estimated shared cost)
Email (estimated): $0.30/month (100 emails/month)
Redis: $0.10/month (rate limiting)
AI features (Phase 9): $1.00/month (estimated usage)
Support overhead: $1.10/month (10% of price for $11 example)

Total Infrastructure Cost: ~$3/month per user
```

### Pricing Formula

```
Monthly Price = Infrastructure Cost / 0.30
  (to achieve 70% margin)

Example:
$3 infrastructure / 0.30 = $10/month minimum

To be competitive:
$11/month ? 70% margin ($7.70 profit)
$19/month ? 84% margin ($16 profit)
$29/month ? 90% margin ($26 profit)
```

**Much lower costs than previously estimated because no video/file/live hosting!**

---

## OPEN QUESTIONS FOR FOUNDER

### 1. Native Hosting Add-on?

Should The Scenes offer a "Native Hosting Pack" as optional add-on?

**If YES:**

- Define pricing (e.g., +$20/month for 100 GB + live streaming)
- Define quotas (storage GB, live minutes)
- Requires cost research for R2 + Bunny.net

**If NO:**

- All plans forever use external embedding
- Simpler architecture
- Lower costs
- Easier to maintain

### 2. Instant Withdrawal Fee Structure?

**Need clarity on OPD-002:**

- What exactly is "SMS + 1%, GH 1"?
- Who pays? Creator or platform?
- What's the minimum withdrawal amount?
- What's the processing time for standard vs instant?

### 3. Pro vs Pro Plus Differentiation?

**Current differences:**

- Pro Plus: Enhanced AI, priority support
- Is this enough to justify higher price?

**Possible additional differentiators:**

- Pro Plus: Lower platform fee (2% instead of 3%)?
- Pro Plus: Free instant withdrawals (no fees)?
- Pro Plus: Native hosting included (not add-on)?
- Pro Plus: Higher storage if native hosting added?

### 4. Free Plan Platform Fee?

**Current:** TBD% for Free plan

**Options:**

- Same 3% as paid plans
- Higher (5-10%) to incentivize upgrade
- No sales allowed on Free plan

**Recommendation:** 5% on Free, 3% on Pro/Pro Plus (incentivizes upgrade)

---

## IMPLEMENTATION NOTES

### Phase 3 (Backend)

- Implement `user.plan` enum
- Implement quota tracking (communities, members)
- ? NO storage quotas needed (no native hosting by default)

### Phase 4 (Email/Notifications)

- Implement Telegram feedback bot
- ? NO R2 file uploads (external embedding only)
- ?? Unless native hosting add-on is offered

### Phase 6 (Live � IF NATIVE ADD-ON OFFERED)

- Only implement if native hosting add-on is offered
- Otherwise: skip (users use Zoom/Meet links)

### Phase 7 (Payments)

- Implement plan subscriptions
- Implement 3% platform fee
- Implement instant withdrawal WITH FEES
- Standard payout (free, slower)
- Instant payout (fee charged to creator)

### Phase 9 (AI)

- Implement AI co-pilot (Pro/Pro Plus only)
- Track API usage
- Enforce quotas by plan

---

## COMPETITIVE ADVANTAGE

**The Scenes Unique Position:**

**vs Skool ($99/month):**

- The Scenes Free: $0 with external embedding (Skool has no free tier)
- The Scenes Pro: Likely $11-29/month (much cheaper than Skool)
- African-first pricing (GHS)

**vs Circle ($39-219/month):**

- The Scenes leverages users' existing YouTube/Google accounts
- Lower cost = lower price
- 3% transaction fee (Circle charges 0% but higher monthly)

**vs Teachable (Free with 10% fee):**

- The Scenes Free: Lower fee (5%?) than Teachable Free (10%)
- The Scenes Pro: 3% fee (lower than Teachable Basic 5%)

**Key Message:**
"The Scenes works with your existing tools (YouTube, Google Docs, Zoom) � no expensive hosting fees, just powerful community and learning features."

---

## FINAL RULE

**CORRECTED UNDERSTANDING:**

1. ? All plans use external embedding (YouTube, Google Docs, Zoom)
2. ? No native hosting by default
3. ? Instant withdrawals have fees (not free)
4. ? Much lower infrastructure costs
5. ? Easier to achieve 70% margin
6. ?? Native hosting as add-on is TBD (requires separate decision)

**Agent must:**

1. Research infrastructure costs (much lower now)
2. Research instant payout fees (Paystack, mobile money)
3. Propose pricing that achieves 70% margin
4. Get founder approval before implementation
