# The Scenes � Reward Infrastructure

This document details the technical implementation of the referral reward system.

**Cross-reference:** See `REFERRAL-QUOTA-ARCHITECTURE.md` for the conceptual architecture. This document focuses on implementation details.

## Core principle

Referral rewards are **platform entitlements**, not provider capacity.

A reward like "+5 GB storage" means the creator has earned the right to use an additional 5 GB within the platform's total available capacity, not that 5 GB of new cloud storage has magically appeared.

## Reward types

| Reward type            | Unit                | Example                       |
| ---------------------- | ------------------- | ----------------------------- |
| Storage allowance      | Bytes               | +2 GB storage                 |
| Live session allowance | Participant-minutes | +5,000 live minutes           |
| Feature unlock         | Boolean flag        | Advanced analytics enabled    |
| Publishing slots       | Count               | +10 workflow publishing slots |
| Priority support       | Boolean flag        | Priority support enabled      |

## Data model

### referrals table

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_user_id UUID NOT NULL REFERENCES users(id),
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'qualified', 'rejected', 'reversed')),
  qualified_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(referrer_id, referred_user_id),
  CHECK(referrer_id != referred_user_id)
);
```

**State machine:**

- `pending` ? referred user clicked link, not yet qualified
- `qualified` ? user completed meaningful action (e.g., verified email, completed onboarding)
- `credited` ? reward applied to referrer's entitlement ledger
- `rejected` ? failed fraud/abuse checks
- `reversed` ? initially credited but later reversed (fraud detected)

### referral_events table

```sql
CREATE TABLE referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id),
  event_type TEXT NOT NULL,
  event_key TEXT NOT NULL UNIQUE,  -- Idempotency key
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Event types:**

- `referral.created`
- `referral.qualified`
- `referral.credited`
- `referral.rejected`
- `referral.reversed`

**Idempotency:** `event_key` ensures duplicate events are ignored.

### creator_entitlements table

```sql
CREATE TABLE creator_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  storage_bytes_granted BIGINT NOT NULL DEFAULT 0,
  live_minutes_granted BIGINT NOT NULL DEFAULT 0,
  feature_flags JSONB NOT NULL DEFAULT '{}',
  publishing_slots_granted INT NOT NULL DEFAULT 0,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,  -- NULL = indefinite
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(creator_id, effective_from)
);
```

**Feature flags example:**

```json
{
  "advanced_analytics": true,
  "priority_support": true,
  "custom_branding": false
}
```

### creator_usage table

```sql
CREATE TABLE creator_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  period_key TEXT NOT NULL,  -- e.g., "2026-10", "2026-11"
  storage_bytes_used BIGINT NOT NULL DEFAULT 0,
  live_minutes_used BIGINT NOT NULL DEFAULT 0,
  workflows_published INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(creator_id, period_key)
);
```

**Period key format:** `YYYY-MM` for monthly tracking, `YYYY-Www` for weekly, or `YYYY-MM-DD` for daily.

### provider_accounts table (Phase 6+)

```sql
CREATE TABLE provider_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,  -- 'livekit', 'daily', 'r2', etc.
  label TEXT NOT NULL,
  region TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'exhausted', 'error')),
  secret_reference TEXT NOT NULL,  -- e.g., 'LIVEKIT_API_KEY_1' (env var name)
  project_id TEXT,  -- Provider-specific project/bucket ID
  quota_guardrail JSONB NOT NULL DEFAULT '{}',  -- e.g., {"max_minutes": 4500, "max_storage_gb": 9}
  current_usage_estimate JSONB NOT NULL DEFAULT '{}',
  last_reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(provider, label)
);
```

**Example row:**

```json
{
  "id": "...",
  "provider": "livekit",
  "label": "LiveKit Primary",
  "region": "us-east-1",
  "status": "active",
  "secret_reference": "LIVEKIT_API_KEY",
  "project_id": "the-scenes-prod",
  "quota_guardrail": { "max_minutes": 4500 },
  "current_usage_estimate": { "minutes_used": 1234 },
  "last_reconciled_at": "2026-10-29T10:00:00Z"
}
```

**Critical:** Never store raw API keys in this table. Only store environment variable names or secret manager references.

### provider_usage table (Phase 6+)

```sql
CREATE TABLE provider_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id UUID NOT NULL REFERENCES provider_accounts(id),
  period_key TEXT NOT NULL,  -- Same format as creator_usage
  resource_type TEXT NOT NULL,  -- 'storage', 'live_minutes', 'api_calls', etc.
  usage BIGINT NOT NULL DEFAULT 0,
  source TEXT NOT NULL,  -- 'metered', 'estimated', 'reconciled'
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(provider_account_id, period_key, resource_type)
);
```

## Reward calculation flow

### 1. Referral creation

User clicks referral link ? creates `referrals` row with `status = 'pending'`

```typescript
async function createReferral(referrerCode: string, referredUserId: string) {
  const referrer = await getUserByReferralCode(referrerCode);

  if (!referrer) throw new Error("Invalid referral code");
  if (referrer.id === referredUserId) throw new Error("Self-referral not allowed");

  const existing = await getReferral(referrer.id, referredUserId);
  if (existing) return existing; // Idempotent

  const referral = await db.referrals.create({
    referrer_id: referrer.id,
    referred_user_id: referredUserId,
    referral_code: referrerCode,
    status: "pending",
  });

  await db.referral_events.create({
    referral_id: referral.id,
    event_type: "referral.created",
    event_key: `referral.created.${referral.id}`,
  });

  return referral;
}
```

### 2. Qualification trigger

Referred user completes meaningful action (e.g., email verification, first course enrollment)

```typescript
async function qualifyReferral(referralId: string) {
  const referral = await db.referrals.findUnique({ where: { id: referralId } });

  if (!referral) throw new Error("Referral not found");
  if (referral.status !== "pending") return; // Already processed

  // Fraud checks
  const passed = await runFraudChecks(referral);
  if (!passed) {
    await db.referrals.update({
      where: { id: referralId },
      data: { status: "rejected", rejection_reason: "Failed fraud checks" },
    });
    return;
  }

  // Mark qualified
  await db.referrals.update({
    where: { id: referralId },
    data: { status: "qualified", qualified_at: new Date() },
  });

  await db.referral_events.create({
    referral_id: referralId,
    event_type: "referral.qualified",
    event_key: `referral.qualified.${referralId}`,
  });

  // Trigger reward crediting (async job)
  await queueRewardCredit(referralId);
}
```

### 3. Reward crediting

Referral is qualified ? apply reward to creator entitlements

```typescript
async function creditReferralReward(referralId: string) {
  const referral = await db.referrals.findUnique({ where: { id: referralId } });

  if (!referral || referral.status !== "qualified") return;

  // Idempotency check
  const eventKey = `referral.credited.${referralId}`;
  const existing = await db.referral_events.findUnique({ where: { event_key: eventKey } });
  if (existing) return; // Already credited

  // Determine reward tier
  const reward = await calculateReward(referral.referrer_id);

  // Apply to entitlements
  await db.creator_entitlements.upsert({
    where: { creator_id: referral.referrer_id },
    update: {
      storage_bytes_granted: { increment: reward.storage_bytes },
      live_minutes_granted: { increment: reward.live_minutes },
      feature_flags: { ...existingFlags, ...reward.feature_flags },
      updated_at: new Date(),
    },
    create: {
      creator_id: referral.referrer_id,
      storage_bytes_granted: reward.storage_bytes,
      live_minutes_granted: reward.live_minutes,
      feature_flags: reward.feature_flags,
      status: "active",
    },
  });

  // Mark credited
  await db.referrals.update({
    where: { id: referralId },
    data: { status: "credited", credited_at: new Date() },
  });

  await db.referral_events.create({
    referral_id: referralId,
    event_type: "referral.credited",
    event_key: eventKey,
  });

  // Notify creator
  await notifyCreator(referral.referrer_id, "New referral reward unlocked!");
}
```

## Reward tiers (example policy)

| Qualified referrals | Storage    | Live minutes    | Features           |
| ------------------- | ---------- | --------------- | ------------------ |
| 1�4                 | +1 GB each | +1,000 min each | �                  |
| 5�9                 | +2 GB each | +2,000 min each | Advanced analytics |
| 10�24               | +3 GB each | +3,000 min each | Priority support   |
| 25+                 | +5 GB each | +5,000 min each | Custom branding    |

**Cumulative:** Rewards stack. A creator with 10 qualified referrals gets:

- 4�1GB + 5�2GB + 1�3GB = 17 GB storage
- 4�1,000 + 5�2,000 + 1�3,000 = 17,000 live minutes

**Founder approval required** before finalizing reward tier policy (see OPD-010).

## Quota evaluation

Before allowing a creator to use a resource:

```typescript
async function canUseResource(
  creatorId: string,
  resourceType: "storage" | "live_minutes",
  amount: number,
): Promise<boolean> {
  // 1. Check creator entitlement
  const entitlement = await getEntitlement(creatorId);
  const usage = await getUsage(creatorId, getCurrentPeriod());

  const creatorRemaining = entitlement[`${resourceType}_granted`] - usage[`${resourceType}_used`];
  if (creatorRemaining < amount) return false; // Creator exceeded entitlement

  // 2. Check global provider capacity
  const providerRemaining = await getProviderCapacity(resourceType);
  if (providerRemaining < amount) return false; // Provider capacity exhausted

  // 3. Check account status
  const accountHealthy = await isProviderAccountHealthy(resourceType);
  if (!accountHealthy) return false;

  // 4. Safety limit check
  const safetyLimitExceeded = await isSafetyLimitExceeded(creatorId, resourceType);
  if (safetyLimitExceeded) return false;

  return true;
}
```

## Provider capacity checking (Phase 6+)

```typescript
async function getProviderCapacity(resourceType: "storage" | "live_minutes"): Promise<number> {
  const accounts = await db.provider_accounts.findMany({
    where: { status: "active", provider: getProviderForResource(resourceType) },
  });

  let totalRemaining = 0;
  for (const account of accounts) {
    const guardrail = account.quota_guardrail[resourceType];
    const used = account.current_usage_estimate[resourceType] || 0;
    totalRemaining += guardrail - used;
  }

  return Math.max(0, totalRemaining);
}
```

## Fraud checks

```typescript
async function runFraudChecks(referral: Referral): Promise<boolean> {
  const referrer = await getUser(referral.referrer_id);
  const referred = await getUser(referral.referred_user_id);

  // 1. Self-referral (already checked at creation, double-check)
  if (referrer.id === referred.id) return false;

  // 2. Duplicate relationship
  const duplicate = await db.referrals.findFirst({
    where: {
      referrer_id: referral.referrer_id,
      referred_user_id: referral.referred_user_id,
      status: { in: ["qualified", "credited"] },
    },
  });
  if (duplicate) return false;

  // 3. Same email domain (suspicious for non-business domains)
  if (isSuspiciousDomain(referrer.email, referred.email)) return false;

  // 4. Same IP address (if tracked and within suspicious timeframe)
  if (await isSameRecentIP(referrer.id, referred.id)) return false;

  // 5. Velocity check (too many referrals too fast)
  const recentCount = await countRecentReferrals(referrer.id, 24 * 60 * 60 * 1000); // 24 hours
  if (recentCount > 10) return false;

  // 6. Referred user activation check
  const activated = await isUserActivated(referred.id);
  if (!activated) return false;

  return true;
}
```

## Reward reversal (fraud detected post-credit)

```typescript
async function reverseReferralReward(referralId: string, reason: string) {
  const referral = await db.referrals.findUnique({ where: { id: referralId } });

  if (!referral || referral.status !== "credited") return;

  // Calculate reward to reverse
  const reward = await calculateReward(referral.referrer_id);

  // Deduct from entitlements
  await db.creator_entitlements.update({
    where: { creator_id: referral.referrer_id },
    data: {
      storage_bytes_granted: { decrement: reward.storage_bytes },
      live_minutes_granted: { decrement: reward.live_minutes },
      updated_at: new Date(),
    },
  });

  // Mark reversed
  await db.referrals.update({
    where: { id: referralId },
    data: { status: "reversed", rejection_reason: reason },
  });

  await db.referral_events.create({
    referral_id: referralId,
    event_type: "referral.reversed",
    event_key: `referral.reversed.${referralId}.${Date.now()}`,
    metadata: { reason },
  });

  // Notify creator
  await notifyCreator(
    referral.referrer_id,
    "A referral reward was reversed due to suspicious activity.",
  );
}
```

## Creator dashboard queries

### Current entitlements

```typescript
async function getCreatorEntitlements(creatorId: string) {
  return await db.creator_entitlements.findUnique({
    where: { creator_id: creatorId, status: "active" },
  });
}
```

### Current usage

```typescript
async function getCreatorUsage(creatorId: string, periodKey: string) {
  return await db.creator_usage.findUnique({
    where: { creator_id_period_key: { creator_id: creatorId, period_key: periodKey } },
  });
}
```

### Referral stats

```typescript
async function getReferralStats(creatorId: string) {
  const total = await db.referrals.count({ where: { referrer_id: creatorId } });
  const pending = await db.referrals.count({
    where: { referrer_id: creatorId, status: "pending" },
  });
  const qualified = await db.referrals.count({
    where: { referrer_id: creatorId, status: "qualified" },
  });
  const credited = await db.referrals.count({
    where: { referrer_id: creatorId, status: "credited" },
  });

  return { total, pending, qualified, credited };
}
```

## UX considerations

### Referral dashboard should show

- Total referrals (pending, qualified, credited)
- Current entitlements (storage GB, live minutes, features)
- Current usage this period
- Remaining capacity
- Next milestone ("1 more referral to unlock +2 GB storage!")
- Global capacity status (if low)

### When capacity is exhausted

Display:

> "You have 5 GB of storage entitlement remaining, but the platform is currently at capacity. Your files are safe, but new uploads are temporarily paused. We're working on adding more capacity."

Do NOT display:

> "Unlimited free storage from referrals!"

## Implementation phases

### Phase 2 (Frontend with Fixtures)

- Display referral dashboard UI
- Show fixture entitlements
- Show fixture usage
- No real referral links yet

### Phase 5 (Creator Operations)

- Implement referral link generation
- Implement qualification logic
- Implement entitlement tracking
- Implement fraud checks
- Implement reward crediting

### Phase 6+ (Provider Integration)

- Implement provider account management
- Implement global capacity checking
- Implement usage metering
- Implement reconciliation

## Testing

### Unit tests

- Reward calculation
- Fraud detection logic
- Idempotency

### Integration tests

- Referral creation flow
- Qualification flow
- Credit flow
- Reversal flow

### E2E tests

- Creator generates referral link
- Referred user signs up
- Referral qualifies
- Creator sees updated entitlements

## Security considerations

- Never expose raw provider credentials
- Rate limit referral link generation
- Implement CAPTCHA if abuse is detected
- Audit all referral state changes
- Log fraud check decisions
- Monitor for unusual patterns
