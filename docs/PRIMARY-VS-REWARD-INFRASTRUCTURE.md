# The Scenes � PRIMARY vs REWARD INFRASTRUCTURE (STRICT SEPARATION CONTRACT)

## CRITICAL MANDATE

This document establishes an **ABSOLUTE, NON-NEGOTIABLE SEPARATION** between:

1. **PRIMARY APPLICATION INFRASTRUCTURE** � runs the actual product
2. **REFERRAL/REWARD INFRASTRUCTURE** � provides bonus capacity from referral achievements

**THEY ARE NOT THE SAME SYSTEM.**

**THEY MUST NEVER BE CONFUSED.**

**AN AGENT THAT MERGES THEM HAS FAILED.**

---

## WHY THIS SEPARATION EXISTS

### The Financial Safety Problem

If referral rewards automatically consume paid primary infrastructure:

- Creator earns "+5,000 live minutes" from referrals
- System exhausts free reward capacity
- System silently falls back to paid primary live provider
- **Result: Unexpected bills, runaway costs, business model failure**

### The Correct Architecture

```
CREATOR EARNS REWARD
        ?
Check reward-specific capacity
        ?
   Available? ? Use reward provider
        ?
   Exhausted? ? STOP (do not charge primary account)
        ?
Inform user: "Entitlement exists, capacity temporarily unavailable"
```

**NEVER:**

```
Reward capacity exhausted ? Use primary paid provider
```

---

## PRIMARY APPLICATION INFRASTRUCTURE

###What It Is

The **production infrastructure** that runs The Scenes platform for all users.

### What It Powers

- Authentication (Supabase Auth)
- User accounts, profiles, roles
- Communities, posts, comments, reactions
- Courses, modules, lessons
- Learning progress, completion tracking
- Events, calendar, scheduling
- Core resources, workflows
- Platform permissions, authorization
- Primary notifications
- Primary analytics
- Core application state
- Mission-critical platform functions

### Selection Criteria

Primary providers are chosen for:

- **Reliability** � production uptime requirements
- **Security** � handles sensitive user data
- **Performance** � affects all users
- **Maintainability** � long-term operational fit
- **Scalability** � supports platform growth
- **Feature completeness** � required capabilities
- **Vendor stability** � not a free-tier experiment

### Current Primary Stack Direction

| Component     | Provider                                 | Rationale                         |
| ------------- | ---------------------------------------- | --------------------------------- |
| Hosting/Edge  | Cloudflare                               | Global CDN, security, performance |
| Auth          | Supabase                                 | Production auth, proven scale     |
| Database      | Supabase Postgres                        | Relational integrity, RLS         |
| Realtime      | Supabase Realtime                        | WebSocket, presence               |
| Storage       | Cloudflare R2                            | S3-compatible, cost-effective     |
| Email         | Resend                                   | Transactional reliability         |
| Rate Limiting | Redis-compatible                         | Short-lived coordination          |
| Search        | Postgres (Phase 3), Dedicated (Phase 9+) | Start simple, scale when needed   |
| Payments      | TBD (Phase 7)                            | Evaluation pending                |

**Payment Model:** Paid plans where necessary (Supabase Pro if needed, R2 usage-based)

**NOT selected based on:** "Has a free tier"

---

## REFERRAL/REWARD INFRASTRUCTURE

### What It Is

A **separate capacity layer** that provides bonus platform benefits to creators who successfully refer others.

### What It Powers

- **Additional storage allowance** � beyond baseline
- **Additional live session capacity** � beyond baseline
- **Extra publishing slots** � beyond baseline
- **Premium creator features** � analytics, branding, etc.
- **Temporary feature unlocks** � experimental capabilities

### Selection Criteria

Reward providers are chosen for:

- **Zero-cost operation** � free tiers, promotional capacity
- **Legitimate use** � allowed by provider terms
- **Measurable quotas** � can track usage
- **Independent failure** � does not break core platform
- **Replaceable** � can swap providers without migration
- **Transparent limits** � users understand capacity constraints

### Current Reward Stack Direction (Phase 5+)

| Component                | Potential Providers                             | Status     |
| ------------------------ | ----------------------------------------------- | ---------- |
| Additional Storage       | Free-tier cloud storage (if terms allow)        | Evaluation |
| Additional Live Capacity | Bunny.net, LiveKit Free, Daily Free, Agora Free | Evaluation |
| Feature Flags            | Internal (database-backed)                      | Phase 5    |
| Publishing Slots         | Internal (database-backed)                      | Phase 5    |

**Payment Model:** ZERO-COST by default, explicit approval required for paid usage

**Selected based on:** Legitimate free capacity that supplements primary infrastructure

---

## ABSOLUTE SEPARATION RULES

### Rule 1: Independent Provider Registries

**PRIMARY PROVIDERS:**

```sql
CREATE TABLE primary_providers (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,  -- 'supabase', 'cloudflare', 'resend', etc.
  capability TEXT NOT NULL,  -- 'auth', 'storage', 'email', etc.
  environment TEXT NOT NULL,  -- 'production', 'staging', 'development'
  plane TEXT NOT NULL CHECK (plane = 'PRIMARY'),
  secret_reference TEXT NOT NULL,
  cost_model TEXT NOT NULL,  -- 'paid', 'usage-based', 'subscription'
  status TEXT NOT NULL,
  ...
);
```

**REWARD PROVIDERS:**

```sql
CREATE TABLE reward_providers (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,  -- 'provider-a', 'provider-b', etc.
  capability TEXT NOT NULL,  -- 'storage', 'live', etc.
  environment TEXT NOT NULL,
  plane TEXT NOT NULL CHECK (plane = 'REWARD'),
  secret_reference TEXT NOT NULL,
  cost_model TEXT NOT NULL CHECK (cost_model = 'ZERO_COST'),
  approved_for_reward_use BOOLEAN NOT NULL DEFAULT false,
  quota_limit JSONB NOT NULL,
  usage JSONB NOT NULL,
  safety_reserve_pct INT NOT NULL DEFAULT 10,
  status TEXT NOT NULL,
  ...
);
```

**NEVER:**

- Store primary and reward providers in the same ambiguous table
- Reuse primary provider credentials for reward workloads
- Mark a primary provider as "also available for rewards"

### Rule 2: Independent Secret Management

**PRIMARY SECRETS:**

```
PRIMARY_SUPABASE_URL
PRIMARY_SUPABASE_ANON_KEY
PRIMARY_SUPABASE_SERVICE_KEY
PRIMARY_R2_ACCESS_KEY_ID
PRIMARY_R2_SECRET_ACCESS_KEY
PRIMARY_RESEND_API_KEY
PRIMARY_REDIS_URL
```

**REWARD SECRETS:**

```
REWARD_STORAGE_PROVIDER_A_KEY
REWARD_STORAGE_PROVIDER_B_KEY
REWARD_LIVE_PROVIDER_A_KEY
REWARD_LIVE_PROVIDER_B_KEY
```

**NEVER:**

- Reuse `PRIMARY_*` secrets for reward operations
- Store secrets in database JSON columns
- Mix primary and reward secrets in the same environment variable

### Rule 3: Independent Usage Tracking

**PRIMARY USAGE:**

```sql
CREATE TABLE primary_usage (
  id UUID PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES primary_providers(id),
  period_key TEXT NOT NULL,  -- '2026-10'
  resource_type TEXT NOT NULL,  -- 'storage_gb', 'api_calls', 'bandwidth_gb'
  usage BIGINT NOT NULL,
  cost DECIMAL(10,2),
  ...
);
```

**REWARD USAGE:**

```sql
CREATE TABLE reward_usage (
  id UUID PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES reward_providers(id),
  period_key TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  usage BIGINT NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0.00 CHECK (cost = 0.00),  -- MUST be zero
  ...
);
```

**Separate dashboards:**

- Admin sees "Primary Infrastructure Usage" (with costs)
- Admin sees "Reward Infrastructure Usage" (always zero-cost)
- Never combine them into one confusing number

### Rule 4: NO AUTOMATIC FAILOVER FROM REWARD TO PRIMARY

**FORBIDDEN LOGIC:**

```typescript
// ? NEVER DO THIS
async function uploadRewardFile(file, creatorId) {
  try {
    return await rewardStorageProvider.upload(file);
  } catch (QuotaExceededError) {
    // ? WRONG: Falls back to paid primary storage
    return await primaryStorageProvider.upload(file);
  }
}
```

**CORRECT LOGIC:**

```typescript
// ? CORRECT
async function uploadRewardFile(file, creatorId) {
  const rewardProvider = await selectAvailableRewardProvider("storage");

  if (!rewardProvider) {
    throw new RewardCapacityUnavailableError(
      "You have storage entitlement, but reward capacity is temporarily full. " +
        "Your files are safe. We are working on adding capacity.",
    );
  }

  return await rewardProvider.upload(file);
}
```

**Never:**

- Silently fall back to paid infrastructure
- Auto-enable paid overages
- Upgrade provider plans automatically
- Create billing without explicit approval

### Rule 5: Entitlement ? Capacity

**Creator Entitlement (Logical):**

```sql
CREATE TABLE creator_entitlements (
  creator_id UUID NOT NULL,
  storage_bytes_granted BIGINT NOT NULL DEFAULT 0,
  live_minutes_granted BIGINT NOT NULL DEFAULT 0,
  feature_flags JSONB NOT NULL DEFAULT '{}',
  ...
);
```

**Creator Usage (Actual):**

```sql
CREATE TABLE creator_usage (
  creator_id UUID NOT NULL,
  period_key TEXT NOT NULL,
  storage_bytes_used BIGINT NOT NULL DEFAULT 0,
  live_minutes_used BIGINT NOT NULL DEFAULT 0,
  ...
);
```

**Reward Capacity (Physical):**

```typescript
async function getAvailableRewardCapacity(resourceType: "storage" | "live"): Promise<number> {
  const providers = await getActiveRewardProviders(resourceType);
  let totalAvailable = 0;

  for (const provider of providers) {
    const limit = provider.quota_limit[resourceType];
    const used = provider.usage[resourceType];
    const reserve = limit * (provider.safety_reserve_pct / 100);
    const available = limit - used - reserve;
    totalAvailable += Math.max(0, available);
  }

  return totalAvailable;
}
```

**Quota Check:**

```typescript
async function canUseRewardCapacity(creatorId, resourceType, amount): Promise<boolean> {
  // 1. Does creator have entitlement?
  const entitlement = await getEntitlement(creatorId);
  const usage = await getUsage(creatorId, getCurrentPeriod());
  const creatorRemaining = entitlement[`${resourceType}_granted`] - usage[`${resourceType}_used`];

  if (creatorRemaining < amount) {
    return false; // Creator exceeded their entitlement
  }

  // 2. Does reward infrastructure have capacity?
  const rewardCapacityRemaining = await getAvailableRewardCapacity(resourceType);

  if (rewardCapacityRemaining < amount) {
    return false; // Reward infrastructure exhausted
  }

  // 3. All checks passed
  return true;
}
```

**Critical:** Creator may have entitlement while reward capacity is zero. That's acceptable. Do NOT charge primary infrastructure to fulfill the entitlement.

---

## ZERO-COST MODE (MANDATORY DEFAULT)

### Configuration

```typescript
// Environment variable
REWARD_INFRASTRUCTURE_MODE=ZERO_COST

// Or database setting
reward_infrastructure_settings {
  mode: 'ZERO_COST',
  allow_paid_fallback: false,
  allow_primary_fallback: false,
  max_monthly_spend: 0.00
}
```

### Enforcement

```typescript
async function selectRewardProvider(capability, amount) {
  const config = await getRewardConfig();

  if (config.mode !== "ZERO_COST") {
    throw new ConfigError("REWARD_INFRASTRUCTURE_MODE must be ZERO_COST");
  }

  const providers = await db.reward_providers.findMany({
    where: {
      capability,
      cost_model: "ZERO_COST",
      approved_for_reward_use: true,
      status: "active",
    },
  });

  for (const provider of providers) {
    const available = calculateAvailable(provider, amount);
    if (available >= amount) {
      return provider;
    }
  }

  // No capacity available
  return null; // Caller must handle gracefully
}
```

### Failure Behavior

**When reward capacity exhausted:**

```typescript
throw new RewardCapacityUnavailableError("Reward capacity temporarily unavailable", {
  creatorEntitlement: entitlement,
  creatorUsage: usage,
  creatorRemaining: entitlement - usage,
  globalCapacity: 0,
  message:
    "You have earned this storage, but platform capacity is currently full. " +
    "Your existing files are safe. New uploads will resume when capacity is added.",
});
```

**NEVER:**

```typescript
// ? DO NOT DO THIS
if (!rewardProvider) {
  console.log("Using primary provider as fallback");
  return primaryProvider; // WRONG: Bypasses cost controls
}
```

---

## BILLING SAFETY CHECKS

### Pre-Operation Checklist

Before ANY reward infrastructure operation:

```typescript
async function rewardOperationSafetyCheck(operation: RewardOperation): Promise<SafetyCheckResult> {
  const checks = {
    providerApproved: false,
    withinQuota: false,
    costModelZero: false,
    noPaymentRisk: false,
    noPrimaryFallback: false,
  };

  // 1. Is provider approved for reward use?
  const provider = operation.provider;
  checks.providerApproved = provider.approved_for_reward_use === true;

  // 2. Is operation within quota?
  const available = calculateAvailable(provider, operation.amount);
  checks.withinQuota = available >= operation.amount;

  // 3. Is cost model zero?
  checks.costModelZero = provider.cost_model === "ZERO_COST";

  // 4. Would this create paid usage?
  checks.noPaymentRisk = !wouldTriggerBilling(provider, operation);

  // 5. Is primary fallback disabled?
  const config = await getRewardConfig();
  checks.noPrimaryFallback = config.allow_primary_fallback === false;

  const allPassed = Object.values(checks).every((c) => c === true);

  return { safe: allPassed, checks };
}
```

### Execution Gate

```typescript
async function executeRewardOperation(operation: RewardOperation) {
  const safety = await rewardOperationSafetyCheck(operation);

  if (!safety.safe) {
    throw new RewardOperationBlockedError(
      "Operation blocked by billing safety checks",
      safety.checks,
    );
  }

  // Proceed with operation
  return await operation.execute();
}
```

---

## ADMIN VISIBILITY

### Primary Infrastructure Dashboard

**Shows:**

- Provider name
- Capability
- Current usage
- Projected monthly cost
- Billing status
- Health status
- Last checked

**Example:**

```
PRIMARY INFRASTRUCTURE

Supabase Auth/Database
  Database size: 387 MB / 500 MB (Free tier)
  Storage: 0.8 GB / 1 GB (Free tier)
  Status: Healthy
  Cost: $0/month (within free tier)

Cloudflare R2
  Storage: 4.2 GB / 10 GB (Free tier)
  Requests: 234K / 1M (Free tier Class A)
  Status: Healthy
  Cost: $0/month

Resend
  Emails sent: 1,847 / 3,000 (Free tier monthly)
  Status: Healthy
  Cost: $0/month
```

### Reward Infrastructure Dashboard

**Shows:**

- Provider name
- Capability
- Approved for reward use
- Zero-cost status
- Current usage
- Remaining capacity
- Estimated depletion
- Billing risk
- Health status

**Example:**

```
REWARD INFRASTRUCTURE

Reward Storage Provider A
  Capability: Storage
  Cost model: ZERO_COST ?
  Approved: Yes ?
  Usage: 2.1 GB / 10 GB
  Remaining: 7.9 GB (79%)
  Billing risk: NONE
  Status: Healthy

Reward Live Provider B (LiveKit Free)
  Capability: Live sessions
  Cost model: ZERO_COST ?
  Approved: Yes ?
  Usage: 1,234 minutes / 5,000 minutes
  Remaining: 3,766 minutes (75%)
  Billing risk: NONE
  Status: Healthy
```

**Critical distinction:** Admin can see at a glance that reward infrastructure is consuming only its separate approved zero-cost capacity.

---

## AGENT SAFETY RESPONSIBILITIES

### Before Implementing ANY Referral Feature

Agent must ask:

1. **Could this create a charge?** � Would exhausting reward capacity fall back to paid primary?
2. **Is provider selection explicit?** � Is there a clear `selectRewardProvider()` call?
3. **Is failover controlled?** � Does exhaustion gracefully stop, not charge?
4. **Are secrets separated?** � Are `PRIMARY_*` and `REWARD_*` secrets distinct?
5. **Is usage tracked separately?** � Can we prove reward operations didn't touch primary?

### Before Deploying

Agent must verify:

- `REWARD_INFRASTRUCTURE_MODE=ZERO_COST` is set
- `allow_primary_fallback=false` is set
- Reward provider registry has `cost_model='ZERO_COST'` constraint
- Reward usage table has `cost=0.00` constraint
- Safety checks are in place
- Admin dashboard shows separation

### If Uncertain

**STOP. DO NOT PROCEED.**

Ask:

- Is this operation using primary or reward infrastructure?
- Could this create unexpected costs?
- Is the billing boundary explicit?

Do NOT assume "it will be fine."

---

## PLAIN-ENGLISH EXPLANATION

**For the founder:**

> The main application (user accounts, courses, communities) runs on production infrastructure that we pay for.
>
> The referral reward system runs on separate infrastructure that we get for free from approved providers.
>
> When a creator earns a reward like "+2 GB storage," the system first tries to fulfill that from the free reward infrastructure.
>
> If the reward infrastructure runs out of capacity, the system DOES NOT automatically start using the paid production infrastructure.
>
> Instead, it tells the creator: "You've earned this storage, but capacity is temporarily full. We're working on adding more."
>
> This protects us from unexpected bills and ensures referral rewards don't accidentally cost the business money.

---

## HISTORICAL MISTAKE TO AVOID

**SukaSpace Legacy Warning:**

The old SukaSpace implementation may have contained:

```javascript
// LEGACY PATTERN (DO NOT COPY)
const apiKeyPool = db.table("api_key_pools").where("provider", "livekit");
```

This pattern:

- Mixed primary and reward providers
- Stored raw secrets in database JSON
- Allowed automatic failover without cost checks
- Did not separate entitlement from capacity

**DO NOT resurrect this pattern.**

---

## DOCUMENTATION REQUIREMENTS

This separation MUST be documented in:

- ? This file (PRIMARY-VS-REWARD-INFRASTRUCTURE.md)
- ? REFERRAL-QUOTA-ARCHITECTURE.md
- ? REWARD-INFRASTRUCTURE.md
- ? INTEGRATIONS.md
- ? SECURITY-RULES.md
- ? AGENTS.md
- ? AGENT-CONTEXT.md
- ? ENVIRONMENT-AND-COST-GUARDRAILS.md

Every agent must read this before implementing referral features.

---

## FINAL RULE

**PRIMARY INFRASTRUCTURE IS FOR THE PRODUCT.**

**REWARD INFRASTRUCTURE IS FOR REWARD CAPACITY.**

**THE TWO MUST NEVER BE CONFUSED.**

**THIS IS NOT A SUGGESTION. THIS IS AN ARCHITECTURAL AND FINANCIAL SAFETY BOUNDARY.**

---

## VIOLATION CONSEQUENCES

If an agent violates this separation:

- Referral operations may create unexpected costs
- Free-tier assumptions may fail
- Business model may break
- Users may receive rewards the platform cannot afford
- The architecture will be considered fundamentally broken

**This is a critical failure, not a minor bug.**
