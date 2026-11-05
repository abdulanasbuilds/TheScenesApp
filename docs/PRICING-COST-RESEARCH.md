# The Scenes — Infrastructure Cost Research & Pricing Analysis

> **Status update — 4 November 2026:** This is historical cost evidence, not the current decision
> authority. ADR-029–030 approve external embedding, the paid-plan prices and a 7% Free-plan sales
> fee. Provider prices and the complete cost model must be refreshed before payment implementation.
> See `docs/DATA-LAYER-RESEARCH.md` for the
> current data-platform comparison.

**Research Date:** October 29, 2026  
**Purpose:** Calculate per-user infrastructure costs to establish pricing achieving 70%+ profit margin  
**Status:** ✅ Research Complete — Awaiting Founder Approval on Final Pricing

---

## Executive Summary

**Key Finding:** External embedding architecture (YouTube, Google Docs, Zoom) dramatically reduces infrastructure costs, making 70% profit margin highly achievable at competitive price points.

**Recommended Pricing (USD):**

- **Free Plan:** $0/month (limited to 1 workspace, 100 members)
- **Pro Plan:** $15-19/month (estimated per-user cost: $3-4/month → 74-80% margin)
- **Pro Plus Plan:** $29-39/month (estimated per-user cost: $5-6/month → 79-85% margin)

**Ghana Pricing (GHS):** Calculate at current exchange rate (1 USD ≈ 16 GHS as of 2026)

- Pro: GH₵240-304/month
- Pro Plus: GH₵464-624/month

---

## 1. Infrastructure Cost Breakdown (2026 Rates)

### 1.1 Supabase (Auth + Database + Storage)

**Source:** [Supabase Pricing 2026](https://supabase.com/pricing)

**Free Tier:**

- 2 free projects
- 500 MB database per project
- 1 GB file storage
- 50,000 monthly active users (MAU)
- Unlimited API requests
- Projects pause after 7 days inactivity

**Pro Plan:** $25/month per organization (shared across users)

- 8 GB database
- 100 GB file storage
- 100,000 MAU
- 250 GB egress/month
- Overages:
  - Database: $0.125/GB/month beyond 8 GB
  - Storage: $0.021/GB beyond 100 GB
  - Egress: $0.09/GB beyond 250 GB

**Per-User Allocation:**

```
Scenario: 1,000 Pro users on platform

Database: 8 GB baseline sufficient for initial scale
Storage: Minimal (external embedding = no video/file hosting)
Egress: Mostly API calls, not media delivery

Monthly cost: $25 (shared)
Per-user cost: $25 / 1,000 = $0.03/user/month

At 100 users: $0.25/user/month
At 500 users: $0.05/user/month
At 1,000+ users: $0.03-0.05/user/month
```

**Conservative estimate:** $0.10-0.30/user/month (accounting for growth)

---

### 1.2 Redis (Rate Limiting + Sessions)

**Source:** [Upstash Redis Pricing](https://upstash.com/pricing/redis)

**Free Tier:**

- 500K commands/month
- 250 MB data
- 10 GB bandwidth
- 10,000 commands/second

**Pay-As-You-Go:**

- $0.20 per 100K commands
- First 1 GB storage free, then $0.25/GB/month
- First 200 GB bandwidth free

**Per-User Usage Estimate:**

```
Typical user session pattern:
- Login: 5 Redis commands
- Rate limit checks: 10 commands per hour active
- Session reads: 20 commands per hour active

Active user (2 hours/day): ~600 commands/day = 18K/month
Heavy user (6 hours/day): ~1,800 commands/day = 54K/month

1,000 users average: ~30M commands/month
Cost: 30M / 100K × $0.20 = $60/month
Per-user: $0.06/user/month
```

**Conservative estimate:** $0.05-0.15/user/month

---

### 1.3 Resend (Transactional Email)

**Source:** [Resend Pricing 2026](https://resend.com/pricing)

**Free Tier:**

- 3,000 emails/month
- 100 emails/day limit

**Pro Plan:**

- $20/month for 50,000 emails
- $35/month for 100,000 emails

**Per-User Email Volume:**

```
Typical user receives:
- Welcome email: 1
- Weekly digest: 4/month
- Course notifications: 10/month
- Community updates: 5/month
- Transaction receipts: 2/month

Total: ~22 emails/user/month

1,000 users: 22,000 emails/month
Cost: $20/month (within 50K tier)
Per-user: $0.02/user/month
```

**Conservative estimate:** $0.05-0.20/user/month (accounting for spikes)

---

### 1.4 CDN & Bandwidth (Cloudflare)

**Source:** [Cloudflare Pricing 2026](https://cloudflare.com/plans)

**Free Plan:**

- Unlimited bandwidth for proxied traffic
- No metering for standard HTTP/HTTPS delivery
- DDoS protection included

**Pro Plan:** $20/month (if needed for advanced features)

- Still unmetered bandwidth for CDN
- Advanced analytics
- Faster support

**Cost Analysis:**

```
External embedding = minimal CDN costs
- Video served by YouTube/Vimeo (not our bandwidth)
- Files served by Google Docs/Dropbox (not our bandwidth)
- Our CDN only serves: HTML, CSS, JS, images, thumbnails

Free tier likely sufficient indefinitely.
If Pro needed: $20/month shared = $0.02/user at 1,000 users
```

**Conservative estimate:** $0.01-0.05/user/month

---

### 1.5 AI Features (Phase 9+)

**Source:** [OpenAI API Pricing 2026](https://openai.com/api/pricing)

**GPT-4.1 (Current Production Model):**

- Input: $2.00 per 1M tokens
- Output: $8.00 per 1M tokens

**Moderation API:**

- FREE (doesn't count toward usage limits)

**GPT-6 Luna (Budget Model):**

- Input: $0.10 per 1M tokens
- Output: $0.50 per 1M tokens

**Use Cases & Estimated Costs:**

```
1. Content Moderation (Free):
   - Use free Moderation API
   - Cost: $0

2. AI Thread Summaries (Pro feature):
   - Input: 2,000 tokens/summary
   - Output: 200 tokens/summary
   - Model: GPT-6 Luna (cheap)
   - Cost per summary: (2K × $0.10 + 200 × $0.50) / 1M
     = $0.0002 + $0.0001 = $0.0003
   - User creates 10 summaries/month: $0.003

3. AI Co-pilot (Pro Plus feature):
   - Input: 500 tokens/query
   - Output: 300 tokens/response
   - Model: GPT-4.1 (better quality)
   - Cost per query: (500 × $2 + 300 × $8) / 1M
     = $0.001 + $0.0024 = $0.0034
   - User makes 50 queries/month: $0.17

Average Pro user (light AI): $0.05/month
Average Pro Plus user (heavy AI): $0.50/month
```

**Conservative estimate:**

- Pro: $0.10-0.30/user/month
- Pro Plus: $0.50-1.00/user/month

---

### 1.6 Cloudflare R2 (Object Storage)

**Source:** Cloudflare R2 Pricing

**NOT USED BY DEFAULT** — External embedding means no native file/video hosting.

**If Native Hosting Add-on Offered:**

- Storage: $0.015/GB/month
- Class A operations (write): $4.50 per million
- Class B operations (read): $0.36 per million
- Egress: $0 (no egress fees)

**Conclusion:** Skip R2 costs for base plans (external embedding only).

---

### 1.7 Bunny.net (Video/Live Streaming)

**NOT USED BY DEFAULT** — Users link to YouTube/Vimeo/Zoom/Meet.

**If Native Hosting Add-on Offered:**

- Video storage: $0.005/GB/month
- Standard streaming: $0.005-0.01/GB
- Live streaming: $0.03-0.06/GB

**Conclusion:** Skip Bunny costs for base plans (external embedding only).

---

### 1.8 Vercel / Cloudflare Pages (Hosting)

**Source:** [Vercel Pricing 2026](https://vercel.com/pricing)

**Hobby (Free):**

- 100 GB bandwidth/month
- NOT for commercial use

**Pro:** $20/seat/month

- 1 TB bandwidth included
- $0.01/GB beyond 1 TB
- 1,000 build minutes

**Alternative: Cloudflare Pages (Free)**

- Unlimited bandwidth
- Unlimited requests
- 500 builds/month

**Cost Analysis:**

```
External embedding = minimal bandwidth usage
Most traffic is API calls + lightweight UI

Cloudflare Pages Free tier likely sufficient.
If Vercel needed: $20/month (shared cost, not per-user)
```

**Conservative estimate:** $0.01-0.05/user/month

---

## 2. Payment Processing Fees

### 2.1 Paystack (Primary for Ghana)

**Source:** [Paystack Pricing](https://paystack.com/pricing)

**Ghana Rates:**

- Local cards: 1.5% + GH₵0.50 (capped at GH₵2,000)
- Mobile money: 1.95% (VAT exclusive)
- Transfers: GH₵3 per transfer (failed or successful)

**Nigeria Rates:**

- Local cards: 1.5% + ₦100 (capped at ₦2,000)
- USSD: 1.5% + ₦100 (capped at ₦2,000)
- Bank transfer: 1% (capped at ₦300)

**Example Transaction:**

```
Creator sells course for GH₵500:

Paystack fee (1.95%): GH₵9.75
Platform fee (3%): GH₵15.00
Creator receives: GH₵475.25

WHO PAYS:
- Paystack fee: BUYER (passed through)
- Platform fee: CREATOR (deducted from sale)
```

---

### 2.2 Stripe (International Cards)

**Source:** [Stripe Pricing 2026](https://stripe.com/pricing)

**Standard US Rate:**

- 2.9% + $0.30 per transaction

**International Card Surcharge:**

- +1.5% for non-US cards
- Total: 4.4% + $0.30

**Currency Conversion:**

- +1% when converting currencies

**Effective Rate for African Platform:**

- International cards: 4.4% + $0.30
- With conversion: 5.4% + $0.30

**Example Transaction:**

```
Creator sells course for $50:

Stripe fee (4.4% + $0.30): $2.50
Platform fee (3%): $1.50
Creator receives: $46.00

WHO PAYS:
- Stripe fee: BUYER (passed through)
- Platform fee: CREATOR (deducted from sale)
```

---

### 2.3 Flutterwave (Alternative)

**Source:** [Flutterwave Ghana Pricing](https://flutterwave.com/gh/pricing)

**Ghana Rates:**

- Local cards: 2.6%
- Bank transfer: 2%
- Mobile money: 2%
- International cards: 4.8%

**Transfer Fees:**

- GH₵1 flat fee per transfer

**Comparison:**

- Mobile money: Flutterwave (2%) vs Paystack (1.95%) → Paystack cheaper
- International: Flutterwave (4.8%) vs Stripe (4.4%) → Stripe cheaper

**Conclusion:** Use Paystack for Ghana, Stripe for international.

---

### 2.4 Transaction Fee Pass-Through Model

**CRITICAL RULE:** All processor fees passed to buyer, NOT absorbed by platform.

**Example Checkout Flow:**

```
Course Price: GH₵500
Payment Method: Mobile Money (Paystack 1.95%)

Subtotal: GH₵500.00
Payment Processing Fee: GH₵9.75
TOTAL CHARGED TO BUYER: GH₵509.75

Creator receives: GH₵500.00
Platform fee (3%): GH₵15.00
Creator net: GH₵485.00

Platform revenue: GH₵15.00 (pure profit, no fee absorption)
```

**This is standard practice:**

- Gumroad: Passes fees to buyers
- Stripe Checkout: Option to pass fees
- Ko-fi: Passes fees (5% + processor)

---

## 3. Per-User Cost Summary

### 3.1 Free Plan (No Monthly Fee)

**Infrastructure Costs:**

```
Supabase (shared): $0.01/user/month
Redis: $0.02/user/month
Email (minimal): $0.01/user/month
CDN: $0.01/user/month
AI: $0 (no AI features)

TOTAL: ~$0.05/user/month
```

**Revenue Model:**

- No subscription fee
- Platform takes 7% of sales (recommended vs 3% for paid plans)
- Incentivizes upgrade to Pro (lower 3% fee)

**Example:**

```
Free plan creator sells $1,000/month:
Platform revenue: $50/month (5% fee)
Platform cost: $0.05/month
Profit: $49.95 (99.9% margin)
```

---

### 3.2 Pro Plan

**Infrastructure Costs:**

```
Supabase: $0.20/user/month
Redis: $0.10/user/month
Email: $0.15/user/month (higher volume)
CDN: $0.03/user/month
AI features: $0.20/user/month (thread summaries)
Support overhead: 10% of revenue

TOTAL BASE: ~$0.68/user/month
+ Support: 10% of subscription price
```

**Pricing Scenarios:**

**Option A: $15/month**

```
Infrastructure: $0.68
Support (10%): $1.50
TOTAL COST: $2.18/user/month

Revenue: $15.00
Cost: $2.18
Profit: $12.82
Margin: 85.5% ✅ (exceeds 70%)
```

**Option B: $19/month**

```
Infrastructure: $0.68
Support (10%): $1.90
TOTAL COST: $2.58/user/month

Revenue: $19.00
Cost: $2.58
Profit: $16.42
Margin: 86.4% ✅
```

**Recommendation: $19/month USD (GH₵304/month)**

- Higher margin
- Still competitive vs Skool ($99), Circle ($39+)
- Justifies rich feature set

---

### 3.3 Pro Plus Plan

**Infrastructure Costs:**

```
Supabase: $0.25/user/month (higher usage)
Redis: $0.15/user/month
Email: $0.20/user/month
CDN: $0.05/user/month
AI features: $0.80/user/month (advanced co-pilot)
Priority support: 12% of revenue

TOTAL BASE: ~$1.45/user/month
+ Support: 12% of subscription price
```

**Pricing Scenarios:**

**Option A: $29/month**

```
Infrastructure: $1.45
Support (12%): $3.48
TOTAL COST: $4.93/user/month

Revenue: $29.00
Cost: $4.93
Profit: $24.07
Margin: 83.0% ✅
```

**Option B: $39/month**

```
Infrastructure: $1.45
Support (12%): $4.68
TOTAL COST: $6.13/user/month

Revenue: $39.00
Cost: $6.13
Profit: $32.87
Margin: 84.3% ✅
```

**Recommendation: $39/month USD (GH₵624/month)**

- Premium positioning
- Competes with Circle Pro ($79), Kajabi ($119)
- High margin funds advanced AI features

---

## 4. Final Pricing Recommendation

### 4.1 Recommended USD Pricing

| Plan         | Monthly | Annual (2 months free) | Per-User Cost | Margin        |
| ------------ | ------- | ---------------------- | ------------- | ------------- |
| **Free**     | $0      | $0                     | $0.05         | 99%+ on sales |
| **Pro**      | $19     | $190 ($15.83/mo)       | $2.58         | 86.4%         |
| **Pro Plus** | $39     | $390 ($32.50/mo)       | $6.13         | 84.3%         |

### 4.2 Recommended GHS Pricing (1 USD ≈ 16 GHS)

| Plan         | Monthly | Annual   | Per-User Cost | Margin        |
| ------------ | ------- | -------- | ------------- | ------------- |
| **Free**     | GH₵0    | GH₵0     | GH₵0.80       | 99%+ on sales |
| **Pro**      | GH₵304  | GH₵3,040 | GH₵41.28      | 86.4%         |
| **Pro Plus** | GH₵624  | GH₵6,240 | GH₵98.08      | 84.3%         |

**Note:** Round GHS prices for cleaner checkout:

- Pro: GH₵300/month, GH₵3,000/year
- Pro Plus: GH₵620/month, GH₵6,200/year

---

## 5. Competitive Positioning

### 5.1 vs Skool

**Skool:** $99/month (no free tier)

**The Scenes Advantage:**

- Free plan exists (Skool: none)
- Pro at $19/month (81% cheaper than Skool)
- African-first (GHS pricing)
- Mobile-first design

**Target Message:**
"All the power of Skool at 1/5th the price, built for African creators."

---

### 5.2 vs Circle

**Circle:** $39-219/month (no free tier)

**The Scenes Advantage:**

- Free plan exists (Circle: none)
- Pro at $19/month (50% cheaper than Circle Basic)
- Pro Plus at $39/month (matches Circle Basic, exceeds features)
- 3% transaction fee (Circle: 0%, but higher monthly base)

**Target Message:**
"Circle's community power meets Skool's learning structure, at a price African creators can afford."

---

### 5.3 vs Teachable

**Teachable:**

- Free: 10% transaction fee + $1 per sale
- Basic: $39/month + 5% fee
- Pro: $119/month + 0% fee

**The Scenes Advantage:**

- Free: 5% fee (lower than Teachable's 10%)
- Pro: $19/month + 3% fee (cheaper than Teachable Basic)
- Community built-in (Teachable: none)

**Target Message:**
"Teachable + Skool combined, for less than Teachable alone."

---

### 5.4 vs Kajabi

**Kajabi:** $119-319/month (no free tier)

**The Scenes Advantage:**

- Free plan exists (Kajabi: none)
- Pro at $19/month (84% cheaper)
- No complexity overwhelm
- African payment methods

**Target Message:**
"Enterprise features without enterprise pricing."

---

## 6. Revenue Projections

### 6.1 Conservative Launch Scenario (12 Months)

**Assumptions:**

- Aggressive creator acquisition
- 70/20/10 split (Free/Pro/Pro Plus)
- Steady monthly growth

| Month | Total Users | Free  | Pro   | Pro Plus | MRR     |
| ----- | ----------- | ----- | ----- | -------- | ------- |
| 1     | 100         | 70    | 20    | 10       | $570    |
| 3     | 500         | 350   | 100   | 50       | $3,850  |
| 6     | 2,000       | 1,400 | 400   | 200      | $15,400 |
| 12    | 5,000       | 3,500 | 1,000 | 500      | $38,500 |

**Year 1 Total Revenue:** ~$200K

**Platform Fees from Free Users (additional):**
Assume average Free creator earns $500/month:

- 3,500 Free creators × $500 × 5% = $87,500/month additional
- Year 1 total: ~$1.05M in platform fees from Free tier

**Combined Year 1:** ~$1.25M

---

### 6.2 Cost Analysis at Scale

**At 5,000 users (1,000 Pro, 500 Pro Plus, 3,500 Free):**

**Infrastructure Costs:**

```
Supabase Pro: $25/month (shared)
Redis: (5,000 × $0.10) = $500/month
Email: (5,000 × $0.15) = $750/month
AI: (1,000 × $0.20 + 500 × $0.80) = $600/month
CDN: Cloudflare Free or $20/month
Total: ~$1,875/month

Revenue: $38,500/month (subscriptions)
Cost: $1,875/month
Profit: $36,625/month
Margin: 95.1% ✅
```

**This EXCLUDES platform fee revenue from Free users (additional profit).**

---

## 7. Instant Withdrawal Fee Structure

**OPEN QUESTION (OPD-002):** Clarify "SMS + 1%, GH₵1" fee structure.

### 7.1 Proposed Fee Structure

**Standard Payout (Free):**

- Fee: GH₵0 / $0
- Processing time: 3-5 business days
- Method: Bank transfer via Paystack

**Instant Payout (Pro/Pro Plus):**

- Fee: 1% + GH₵1 minimum (or 1% + $0.25 USD)
- Processing time: Minutes to hours
- Method: Instant bank transfer / mobile money

**Example:**

```
Creator balance: GH₵1,000

Standard Payout:
- Fee: GH₵0
- Receives: GH₵1,000
- Time: 3-5 days

Instant Payout:
- Fee: 1% + GH₵1 = GH₵11
- Receives: GH₵989
- Time: <1 hour
```

**Rationale:**

- 1% covers Paystack instant transfer costs
- GH₵1 minimum prevents abuse on tiny withdrawals
- Standard payout remains free (important for budget creators)

---

## 8. Native Hosting Add-on Analysis

**QUESTION:** Should The Scenes offer optional "Native Hosting Pack"?

### 8.1 Cost Analysis (If Offered)

**Native Hosting Pack Includes:**

- Cloudflare R2 storage: 100 GB
- Bunny.net video streaming: 100 GB bandwidth
- Bunny.net live streaming: 10 hours/month

**Monthly Costs:**

```
R2 storage (100 GB): $1.50
Bunny video (100 GB): $1.00
Bunny live (10 hours ≈ 20 GB): $1.20

TOTAL: $3.70/user/month
```

**Pricing to Achieve 70% Margin:**

```
Cost: $3.70
Minimum price: $3.70 / 0.30 = $12.33

Recommended: $15-19/month add-on
Margin: 75-80% ✅
```

### 8.2 Recommendation

**DO NOT OFFER INITIALLY.**

**Reasons:**

1. Adds complexity
2. Users already have YouTube/Google accounts
3. External embedding is competitive advantage (lower prices)
4. Can add later if demand exists

**Alternative Approach:**

- Launch with external embedding only
- Survey users after 6 months
- If >20% want native hosting, consider add-on
- Price at $19/month add-on (80% margin)

---

## 9. Free Plan Platform Fee

**QUESTION:** What platform fee for Free plan? (OPD-016)

### 9.1 Options

**Option A: 5% (Recommended)**

- Higher than Pro/Pro Plus (3%)
- Incentivizes upgrade
- Still lower than Teachable Free (10%)
- Fair for $0 subscription

**Option B: 3% (Same as Paid)**

- Simpler messaging
- Less incentive to upgrade
- May cannibalize Pro sales

**Option C: No Sales on Free**

- Blocks monetization on Free tier
- Forces upgrade to monetize
- Too restrictive, hurts adoption

### 9.2 Recommendation

**5% for Free, 3% for Pro/Pro Plus.**

**Example Impact:**

```
Creator earning $1,000/month:

On Free plan:
- Platform fee (5%): $50
- Net: $950

On Pro plan ($19/month):
- Subscription cost: $19
- Platform fee (3%): $30
- Net: $951

BREAK-EVEN: $1,000/month in sales
Above $1,000: Pro is cheaper
```

**This creates natural upgrade incentive while keeping Free viable for beginners.**

---

## 10. Final Recommendations

### 10.1 Approved Pricing (Pending Founder Confirmation)

| Plan     | USD/Month | GHS/Month | Platform Fee | Margin |
| -------- | --------- | --------- | ------------ | ------ |
| Free     | $0        | GH₵0      | 5%           | 99%+   |
| Pro      | $19       | GH₵300    | 3%           | 86.4%  |
| Pro Plus | $39       | GH₵620    | 3%           | 84.3%  |

### 10.2 Annual Discounts

**Offer 2 months free on annual:**

- Pro Annual: $190 (save $38)
- Pro Plus Annual: $390 (save $78)
- GHS: GH₵3,000 and GH₵6,200 respectively

### 10.3 Instant Withdrawal Fees

**Standard:** Free, 3-5 business days  
**Instant (Pro/Pro Plus only):** 1% + GH₵1 / $0.25 minimum

### 10.4 Native Hosting

**NOT OFFERED INITIALLY** — Revisit after 6 months based on user feedback.

### 10.5 Transaction Fee Pass-Through

**ALL processor fees passed to buyers** (Paystack, Stripe, Flutterwave).

---

## 11. Next Steps

### 11.1 Founder Approval Required

1. ✅ Approve USD pricing ($19 Pro, $39 Pro Plus)
2. ✅ Approve GHS pricing (GH₵300 Pro, GH₵620 Pro Plus)
3. ✅ Approve Free plan fee (5% vs 3%)
4. ✅ Approve instant withdrawal structure (1% + GH₵1)
5. ❌ Decide: Native hosting add-on (not recommended initially)
6. ❌ Decide: Pro vs Pro Plus differentiation (current: AI + support, sufficient?)

### 11.2 Implementation (Phase 7)

After approval:

1. Update PRICING-MONETIZATION.md with final prices
2. Create pricing page UI/UX
3. Implement Supabase plan enum and gates
4. Implement Paystack/Stripe subscription webhooks
5. Implement platform fee calculation (3% or 5%)
6. Implement instant withdrawal option (with fee display)
7. Create quota enforcement system
8. Write pricing tests

---

## 12. Compliance & Attribution

**Research Sources:**

- [Supabase Pricing](https://supabase.com/pricing) — Auth, database, storage costs
- [Upstash Redis Pricing](https://upstash.com/pricing/redis) — Caching and rate limiting costs
- [Resend Pricing](https://resend.com/pricing) — Transactional email delivery costs
- [Paystack Pricing](https://paystack.com/pricing) — Ghana/Nigeria payment processing fees
- [Stripe Pricing 2026](https://stripe.com/pricing) — International card processing fees
- [Flutterwave Ghana Pricing](https://flutterwave.com/gh/pricing) — Alternative payment processor
- [Cloudflare Plans](https://cloudflare.com/plans) — CDN and bandwidth costs
- [OpenAI API Pricing](https://openai.com/api/pricing) — AI feature costs (Phase 9)
- [Vercel Pricing](https://vercel.com/pricing) — Hosting and deployment costs

Content synthesized and calculations performed independently. All pricing verified against official sources as of October 2026.

---

**Document Status:** ✅ Research Complete  
**Next Action:** Founder review and approval of final pricing  
**Blocked:** Phase 7 implementation (awaiting pricing approval)
