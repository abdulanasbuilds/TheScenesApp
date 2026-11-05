# Founder Decisions — Resolution Record

**Date:** 1 November 2026  
**Updated:** 4 November 2026  
**Status:** RESOLVED FOR THE CURRENT STAGE — production platform/region/budget remain later gates  
**Context:** Independent project review found critical conflicts in documentation

---

## Founder answers — 4 November 2026

| Decision | Answer | Resolution state |
|---|---|---|
| Native video/file/live hosting | External embedding only for base plans | Resolved; see ADR-029 |
| Free-plan sales fee | 7% | Resolved; see ADR-030 |
| Paid-plan prices | Pro $19 / GH₵300; Pro Plus $39 / GH₵620 | Resolved; current cost model still must be checked |
| Cloudflare | Use free tier now; upgrade when measured need justifies it | Resolved for current stage |
| Data platform | Supabase approved for a local-only Phase 3 proof-of-fit; production choice remains deferred | Current-stage decision resolved; see ADR-033 |
| Instant withdrawal | 1% + GH₵1 platform fee; pass provider transfer fee to creator | Business rule resolved; provider validation deferred |
| Payment providers | Keep payments on hold | Resolved for current stage; see ADR-034 |

The original analysis below is retained as historical evidence. Where it conflicts with the table
above, `docs/DECISIONS.md` is authoritative. These answers do not authorize Phase 3 integrations,
payments, deployment or provider credentials.

---

## Summary

Your Phase 0 documentation is solid conceptually, but three critical business questions have **conflicting answers across different documents**. Agents building the system will pick one answer at random, potentially building the wrong product.

**Before any code is written, you must decide:**

---

## DECISION 1: Native Video/File Hosting (CRITICAL)

### The Conflict

**Document A** (RES-002, Oct 31) says:
- ✅ Pro includes: Native video + file hosting, 300 GB storage, native live streaming
- ✅ Pro Plus includes: 1 TB storage

**Document B** (PRICING-MONETIZATION.md, Oct 31) says:
- ❌ NO plans include native hosting
- ❌ ALL plans use external embedding only (YouTube, Google Docs, Zoom)

**Document C** (PRICING-COST-RESEARCH.md, Oct 29) says:
- ❌ Do NOT offer native hosting initially
- ✅ External embedding keeps costs low, margins high

### The Math Problem

If Document A is correct (300GB Pro, 1TB Pro Plus):
- Pro cost: $4.50/month for storage alone → **76% margin** (below your 70% rule)
- Pro Plus cost: $15/month for storage alone → **61% margin** (FAILS your 70% rule)
- This excludes video delivery costs ($0.04-0.06 per viewer-hour in Africa)

If Documents B/C are correct (no native hosting):
- Pro cost: ~$2.58/month → **86% margin** ✅
- Pro Plus cost: ~$6.13/month → **84% margin** ✅

### YOUR DECISION REQUIRED

**Which is correct?**

**Option A: NO native hosting (external embedding only)**
- ✅ Pro: 86% margin, Pro Plus: 84% margin
- ✅ Can price at $19/$39 competitively
- ✅ Users already have YouTube/Google accounts
- ✅ Platform focuses on learning/community, not hosting
- ❌ Cannot offer storage as referral reward

**Option B: YES native hosting with LIMITED quotas**
- Pro: 15 GB storage, 15 hours video (margin: 70.2%)
- Pro Plus: 40 GB storage, 30 hours video (margin: 70.7%)
- Must charge overage fees beyond included amounts
- Requires metering, billing, quota enforcement
- More complex, higher support costs

**Option C: Native hosting as PAID ADD-ON**
- Base plans use external embedding (86%/84% margins)
- Optional "Native Hosting Pack" at $15-19/month extra
- Includes storage, video hosting, live streaming
- Keeps base plans affordable

**👉 Your choice:** A, B, or C? _________________

---

## DECISION 2: Free Plan Sales Fee

### The Conflict

Three different percentages across documents:
- **7%** in one section
- **5%** in another section
- **TBD** in a third

### YOUR DECISION REQUIRED

**What percentage fee does the Free plan pay on sales?**

**Option A: 5% (Recommended)**
- Higher than Pro/Pro Plus (3%) → incentivizes upgrade
- Lower than Teachable Free (10%) → competitive
- Break-even point: $950/month in sales (upgrade becomes cheaper)

**Option B: 3% (Same as paid plans)**
- Simpler messaging
- Less upgrade incentive
- May cannibalize Pro sales

**Option C: 7% or higher**
- Stronger upgrade incentive
- Risk: too high vs competitors

**👉 Your choice:** ____% sales fee for Free plan

---

## DECISION 3: Final Pricing Approval

### Proposed Pricing (from cost research)

| Plan | USD/Month | GHS/Month | Platform Fee | Infrastructure Cost | Margin |
|---|---|---|---|---|---|
| Free | $0 | GH₵0 | 5% (TBD above) | $0.05 | 99%+ |
| Pro | $19 | GH₵300 | 3% | $2.58 | 86.4% |
| Pro Plus | $39 | GH₵620 | 3% | $6.13 | 84.3% |

**This assumes NO native hosting (Decision 1, Option A).**

If you choose native hosting, these numbers change.

### YOUR DECISION REQUIRED

**Do you approve these prices?**

**👉 Pro at $19/month (GH₵300):** YES / NO / Change to: $_______  
**👉 Pro Plus at $39/month (GH₵620):** YES / NO / Change to: $_______

---

## DECISION 4: Hosting Infrastructure

### The Conflict

**Docs say:** "Static hosting only, Cloudflare Pages free tier"  
**Setup builds:** Dynamic server app (Cloudflare Workers)

**Problem:** Workers free tier has 10ms CPU limit per request. SSR typically uses 10-20ms. May exceed free tier immediately.

### YOUR DECISION REQUIRED

**Are you willing to pay for Cloudflare Workers Paid ($5/month) if needed?**

**👉 Your choice:** YES, budget for it / NO, must stay free / Let's measure first

---

## DECISION 5: Supabase Production Plan

### The Problem

**Supabase Free tier:**
- ❌ Pauses after 7 days of inactivity
- ❌ NO automatic backups
- ❌ Only 2 projects total
- ❌ Not suitable for production

**Supabase Pro ($25/month):**
- ✅ Daily automatic backups
- ✅ Never pauses
- ✅ Production-grade

### YOUR DECISION REQUIRED

**Will you budget $25/month for Supabase Pro for the live site?**

**👉 Your choice:** YES, budget it / NO, must find alternative / Not sure yet

---

## DECISION 6: Instant Withdrawal Fees

### The Problem

Document says: "Instant withdrawals have fees" but exact fee is unclear.

**Proposed:** 1% + GH₵1 minimum (or 1% + $0.25 USD)

**Issue:** Paystack charges GH₵3 per transfer. On small payouts (<GH₵300), the 1% + GH₵1 fee does NOT cover the GH₵3 cost.

### YOUR DECISION REQUIRED

**What is the instant withdrawal fee structure?**

**👉 Your choice:**
- 1% + GH₵3 minimum (covers Paystack cost)
- 1% + GH₵1 + pass Paystack fee to creator
- Other: _________________________________

---

## DECISION 7: Payment Providers

### The Conflict

**Some docs say:** "Payments on hold, not decided"  
**Other docs say:** "Paystack (Ghana) and Stripe (international) CONFIRMED"

### YOUR DECISION REQUIRED

**Which payment processors will you use?**

**👉 Ghana:** Paystack / Flutterwave / Other: _________  
**👉 International:** Stripe / Other: _________  
**👉 Status:** CONFIRMED / Still evaluating

---

## What Happens Next

### If You Make These Decisions Now:

1. ✅ I will create ONE authoritative cost model document
2. ✅ Mark old conflicting documents as "SUPERSEDED"
3. ✅ Update all documentation to match your decisions
4. ✅ Verify 70% margin rule is met
5. ✅ Run security scan on Git history
6. ✅ Fix project setup (CI, lockfiles, folders)
7. ✅ You can review unified documentation
8. ✅ Proceed to Phase 1 (Design) with confidence

### If You Need Time to Decide:

**That's totally fine!** These are important business decisions. Take the time you need.

**What I can do in the meantime:**
- Run security scan on old Git history (4.1)
- Fix project setup issues (4.4, 4.8)
- Clean up documentation formatting (4.9)
- Expand security rules (4.10)
- Work on non-pricing tasks

**What I CANNOT do until you decide:**
- Write final pricing documentation
- Design referral reward system (depends on what's included in plans)
- Create plan comparison tables
- Build quota/metering system
- Start Phase 1 design work

---

## Quick Decision Form

**COPY AND FILL THIS OUT:**

```
FOUNDER DECISIONS - The Scenes
Date: ___________

1. Native Hosting: A / B / C (circle one, see above)
   If C: Details: _________________________________

2. Free Plan Fee: _____% on sales

3. Pricing Approval:
   - Pro $19/month: YES / NO / Change to: $_____
   - Pro Plus $39/month: YES / NO / Change to: $_____

4. Cloudflare Workers Budget: YES / NO / MEASURE FIRST

5. Supabase Pro Budget: YES / NO / NOT SURE

6. Instant Withdrawal Fee: _______________________

7. Payment Providers:
   - Ghana: _____________
   - International: _____________
   - Status: CONFIRMED / EVALUATING

Additional Notes:
_________________________________________________
_________________________________________________
_________________________________________________

Signed: _________________ Date: _________
```

---

## Questions?

If anything is unclear, ask me to explain:
- The math behind the margins
- Why external embedding is cheaper
- Competitive pricing analysis
- Risk assessment for any option

I'm here to help you make informed decisions! 🚀
