# The Scenes � Legacy Source Inventory

This document catalogs the SukaSpace implementation that exists in Git history but was removed from the working tree.

**Reference:** See `LEGACY-CONTEXT.md` for the rationale and usage rules.

## Repository reset

At commit `894d3f4` (referenced in LEGACY-CONTEXT.md), all SukaSpace application code was removed from `main`.

The Git history preserves the old code, but the working directory is clean.

## What was in SukaSpace (historical implementation)

### Authentication

- **File pattern:** `src/lib/supabase.ts`, auth hooks in `src/hooks/`
- **What it did:** Supabase Auth integration with email/password signup and login
- **Status:** LEGACY IMPL DETAIL
- **Re-implementation:** Phase 3, using current architecture

### Database schema

- **File pattern:** `supabase/migrations/*.sql`
- **Tables:** users, communities, memberships, courses, lessons, enrollments, earnings, withdrawals, feedback
- **Status:** LEGACY IMPL DETAIL
- **Re-implementation:** Phase 3, redesigned from current requirements

### Earnings ledger

- **File pattern:** Revenue/earnings tracking logic (location TBD from history)
- **What it did:** Tracked gross revenue, platform fee (3%), creator share, with idempotency
- **Pattern:** Event-key-based idempotency for preventing duplicate credits
- **Status:** LEGACY IMPL DETAIL � good pattern, percentage is now OPD-004
- **Re-implementation:** Phase 8, with updated revenue split policy

### Withdrawal system

- **File pattern:** Withdrawal balance management (location TBD)
- **What it did:** Managed creator withdrawal requests with race condition fixes
- **Pattern:** Database transactions to prevent double-withdrawal
- **Status:** LEGACY IMPL DETAIL � useful reference
- **Re-implementation:** Phase 8, as part of creator payout system

### Monetization wizard

- **File pattern:** UI for creator monetization setup (location TBD)
- **What it did:** Guided creators through pricing and payout setup
- **Status:** LEGACY IMPL DETAIL
- **Re-implementation:** Phase 5 (creator workspace), Phase 7 (payments)

### Feedback system

- **File pattern:** User feedback submission (location TBD)
- **What it did:** Submitted feedback to Telegram with rate limiting
- **Pattern:** Rate limiting to prevent spam (e.g., 1 feedback/hour per user)
- **Status:** LEGACY IMPL DETAIL � useful rate-limiting reference
- **Re-implementation:** Phase 4, with updated Telegram/alternative channels

### Auto-DM system

- **File pattern:** Automated DM logic (location TBD)
- **What it did:** Sent automated onboarding messages to new users
- **Pattern:** Anti-spoofing checks (prevent impersonation)
- **Status:** DEFERRED (OPD-007) � requires consent model
- **Re-implementation:** Phase 5 (if approved), with consent and opt-out

### Payment integration

- **File pattern:** Paystack integration (location TBD)
- **What it did:** Processed payments via Paystack
- **Status:** LEGACY IMPL DETAIL
- **Re-implementation:** Phase 7, with provider-agnostic adapter

### Webhook handlers

- **File pattern:** Webhook verification logic (location TBD)
- **What it did:** Verified Paystack webhook signatures, handled payment events
- **Pattern:** Signature verification, idempotent event handling
- **Status:** LEGACY IMPL DETAIL � good security pattern
- **Re-implementation:** Phase 7, with current payment provider

### Settings consolidation

- **Commit:** Referenced in LEGACY-CONTEXT.md
- **What it did:** Consolidated user/creator settings into unified interface
- **Status:** LEGACY IMPL DETAIL
- **Re-implementation:** Phase 2 (UI), Phase 3 (real settings)

### PWA refresh

- **Commit:** Referenced in LEGACY-CONTEXT.md
- **What it did:** Added PWA manifest and service worker
- **Status:** LEGACY IMPL DETAIL
- **Re-implementation:** Phase 4, with current PWA strategy

### Supabase migrations

- **File pattern:** `supabase/migrations/*.sql`
- **What they did:** Database schema evolution
- **Status:** LEGACY IMPL DETAIL
- **Re-implementation:** Phase 3, with new schema from current requirements

### Security sentinel branches

- **Branches:** Various `sentinel-*` branches mentioned in LEGACY-CONTEXT.md
- **Purpose:** Security fixes or experimental security work
- **Status:** Historical reference
- **Action:** Review patterns when building Phase 3+ security

## Useful patterns to preserve

### 1. Idempotency (earnings ledger)

**Pattern:** Use event keys to prevent duplicate processing

```typescript
// Example from SukaSpace (reconstruct from Git if needed)
async function creditEarning(event: PaymentEvent) {
  const eventKey = `payment.${event.id}`;

  const existing = await db.earnings_events.findUnique({
    where: { event_key: eventKey },
  });

  if (existing) return; // Already processed

  // Process earning...

  await db.earnings_events.create({
    event_key: eventKey,
    // ...
  });
}
```

**Status:** Re-implement for referral events, payment webhooks, payout calculations

### 2. Race condition prevention (withdrawals)

**Pattern:** Use database transactions for balance operations

```typescript
// Example from SukaSpace (reconstruct from Git if needed)
async function processWithdrawal(userId: string, amount: number) {
  return await db.$transaction(async (tx) => {
    const balance = await tx.balances.findUnique({
      where: { user_id: userId },
      lock: "update", // Row-level lock
    });

    if (balance.available < amount) throw new Error("Insufficient funds");

    await tx.balances.update({
      where: { user_id: userId },
      data: { available: { decrement: amount } },
    });

    await tx.withdrawals.create({
      user_id: userId,
      amount,
      status: "pending",
    });
  });
}
```

**Status:** Re-implement for Phase 8 payout system

### 3. Webhook verification

**Pattern:** Verify provider webhook signatures before processing

```typescript
// Example from SukaSpace (reconstruct from Git if needed)
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
```

**Status:** Re-implement for Phase 7 payment webhooks

### 4. Rate limiting (feedback)

**Pattern:** Rate limit user actions to prevent abuse

```typescript
// Example from SukaSpace (reconstruct from Git if needed)
async function canSubmitFeedback(userId: string): Promise<boolean> {
  const lastFeedback = await db.feedback.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });

  if (!lastFeedback) return true;

  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return lastFeedback.created_at.getTime() < oneHourAgo;
}
```

**Status:** Re-implement for Phase 4 (Redis-based rate limiting)

### 5. Anti-spoofing (auto-DM)

**Pattern:** Prevent impersonation in automated messages

Details TBD (review Git history when implementing Phase 5 messaging)

**Status:** Re-implement for Phase 5 if auto-DM is approved (OPD-007)

## What NOT to carry forward

### Hard-coded assumptions

- SukaSpace branding/naming
- 3% platform fee (now OPD-004)
- Paystack as only payment provider
- Old route structure
- Old localStorage keys
- Old database table names
- Old UI component structure

### Implementation approaches

- Direct Supabase SDK usage in components (should use adapters)
- Client-side authorization checks (should be server-side)
- Hardcoded provider configuration (should use env vars)

## How to access legacy code

### Option 1: Check out old commit

```bash
git checkout 894d3f4~1  # One commit before the reset
```

Browse the code, then return to main:

```bash
git checkout main
```

### Option 2: View specific file from history

```bash
git show 894d3f4~1:path/to/file.ts
```

### Option 3: Search Git log

```bash
git log --all --grep="earnings" --oneline
git log --all --grep="withdrawal" --oneline
```

### Option 4: Browse GitHub

If the repository is on GitHub, browse the commit history UI.

## Remote branches inventory

**Status:** TBD (need to list actual remote branches)

To list all remote branches:

```bash
git branch -r
```

Expected branches based on LEGACY-CONTEXT.md:

- `feature/monetization-wizard-payouts-*`
- `fix-earnings-idempotency-*`
- `fix/ledger-earnings-*`
- `fix/withdrawal-race-conditions-*`
- `sentinel-*`
- `settings-consolidation-*`
- `setup-supabase-migrations-*`
- `v0/*`

**Action for future agents:**

- Review relevant branches when implementing related features
- Extract useful patterns
- DO NOT merge branches into main
- DO NOT restore old schemas/routes as-is

## Agent rule when consulting legacy code

1. **Understand the historical context** (why it was built that way)
2. **Extract the useful pattern** (idempotency, race prevention, etc.)
3. **Re-implement using current architecture** (provider adapters, current naming, current security rules)
4. **Do not copy-paste** (adapt to current requirements and types)
5. **Document the source** (note that pattern came from SukaSpace for future reference)

## Deprecation date

SukaSpace code was deprecated at commit `894d3f4`.

The legacy context remains valid for pattern reference but is not a source of current product requirements.

## Update rule

If additional useful patterns are discovered in Git history:

1. Document them in this file
2. Note which phase they are relevant for
3. Describe the pattern clearly
4. Mark status (re-implement, reference only, rejected)
