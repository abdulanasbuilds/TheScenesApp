# The Scenes — Referral & Quota Architecture

## Purpose

Enable The Scenes to reward referrals with additional platform entitlements without paying cash rewards and without making provider free tiers part of the user's promise.

## Critical distinction

A referral reward is a **platform entitlement**.

A provider free tier is an **infrastructure budget**.

They are not the same thing.

Example:

A creator may earn:
- +2 GB logical storage entitlement;
- +5,000 live participant-minute entitlement;
- access to an advanced creator feature.

That does not mean The Scenes has magically received another 2 GB or 5,000 minutes from a provider.

The system must always enforce:
1. creator entitlement;
2. global provider availability;
3. current usage;
4. provider hard limits;
5. abuse/safety rules.

## Current provider facts used for design

### LiveKit

LiveKit's current documentation lists the Build/free WebRTC allowance at 5,000 participant minutes, plus other project limits. Critically, LiveKit states that free projects share allowances and limits across a user's free projects, so creating additional free projects does not multiply the free quota. Therefore the architecture must not depend on LiveKit project multiplication as a scaling strategy. citeturn393759search9

### Daily

Daily currently advertises 10,000 free video/audio minutes per month for Video SDK. This is infrastructure capacity, not a referral credit balance. citeturn694520search3

### Agora

Agora currently lists 10,000 combined RTC minutes free each month for RTC. Again, this is a provider allowance, not per-creator referral capacity. citeturn694520search1

### Cloudflare R2

R2 currently provides 10 GB-month of Standard storage free each month, plus 1 million Class A requests and 10 million Class B requests; egress is free. Storage is measured as GB-month, so it must not be modelled as an unlimited permanent 10 GB bucket. citeturn694520search0

### Supabase Storage

Supabase currently provides 1 GB storage on the Free plan. The Free plan also has a 500 MB database-size quota before read-only enforcement. Do not treat a Supabase Free project as an unlimited backup pool. citeturn694520search2turn694520search5

## No account-farm architecture

The Scenes must not automate creation or rotation of large numbers of free accounts to evade provider limits, pricing, or plan restrictions.

A provider pool may contain multiple accounts only when:
- the accounts are legitimately controlled by the business;
- the provider permits the arrangement;
- credentials are securely managed;
- billing/ownership is understood;
- usage is reconciled;
- an account can be disabled independently.

The system must never assume that creating another free account creates another free entitlement.

## Data model

### referrals

Fields:
- id
- referrer_id
- referred_user_id
- referral_code
- status: pending | qualified | rejected | reversed
- qualified_at
- credited_at
- rejection_reason
- created_at
- updated_at

Constraints:
- unique referred user per reward program;
- no self-referral;
- idempotent qualification/crediting.

### referral_events

Fields:
- id
- referral_id
- event_type
- event_key
- metadata
- created_at

Use event_key for idempotency.

### creator_entitlements

Fields:
- creator_id
- storage_bytes_granted
- live_minutes_granted
- feature_flags
- effective_from
- effective_until
- status
- updated_at

### creator_usage

Fields:
- creator_id
- period_key
- storage_bytes_used
- live_minutes_used
- workflow_count
- other measured resources
- updated_at

### provider_accounts

Fields:
- id
- provider
- label
- region
- status
- secret_reference
- bucket_or_project_reference
- quota_guardrail
- current_usage_estimate
- last_reconciled_at
- created_at

No raw secret keys.

### provider_usage

Fields:
- provider_account_id
- period_key
- resource_type
- usage
- source
- reconciled_at

## Reward calculation

Do not increment resource limits directly from an Auth trigger.

Prefer:

signup/referral event
→ durable referral record
→ qualification job/function
→ fraud/eligibility checks
→ idempotent reward transaction
→ entitlement ledger
→ notification

This makes reversals, disputes, abuse handling, and audits possible.

## Quota evaluation

Logical decision:

allowed =
creator_entitlement_remaining > 0
AND provider_global_remaining > required_amount
AND account_status = healthy
AND safety_limit_not_exceeded

The creator entitlement may be granted for a billing/usage period and must expire/reset according to policy.

## Live provider routing

Use an internal interface such as:

startLiveSession()
endLiveSession()
getSessionStatus()
getUsage()
selectProvider()

Provider adapters:
- LiveKitAdapter
- DailyAdapter
- AgoraAdapter

Selection should consider:
- creator entitlement;
- global provider remaining quota;
- concurrency;
- provider health;
- session requirements;
- approved provider/account status.

A provider switch should normally happen before session start or after a controlled reconnect. Do not promise a silent SDK swap during an active call.

## Storage routing

Use:

request upload
→ authorize creator/resource
→ calculate available creator entitlement
→ select approved storage account
→ generate controlled upload URL
→ record object location
→ finalize usage
→ notify/measure

Use a safety reserve below the hard free-tier boundary.

The system should reject new uploads rather than unexpectedly incur charges when every approved pool is exhausted.

## Referral abuse controls

At minimum consider:
- verified account;
- unique referral relationship;
- self-referral rejection;
- repeated device/IP/email/domain heuristics where lawful and appropriate;
- velocity limits;
- suspicious cluster review;
- delayed credit until meaningful activation;
- reward caps;
- reversible rewards;
- audit log.

Do not make the reward system depend on any single client-side signal.

## UX

Creators should see:

Referral dashboard:
- current referral count;
- pending referrals;
- qualified referrals;
- current unlocked benefits;
- current usage;
- remaining entitlement;
- global capacity status;
- next milestone;
- reward history.

Important copy:
"Referral rewards unlock platform benefits. Availability is subject to current platform capacity and usage limits."

Avoid:
"Refer friends to get unlimited free streaming."

## Failure behavior

When infrastructure is exhausted:
- do not fail silently;
- do not oversubscribe;
- do not auto-enable paid usage without explicit user authorization;
- tell the creator the entitlement exists but current capacity is temporarily unavailable;
- offer the safe alternative allowed by the product.

## Agent requirements

Any agent implementing referral/quota logic must read:
- `AGENTS.md`
- `docs/INTEGRATIONS.md`
- `docs/SECURITY-RULES.md`
- this document
- current official provider documentation

The agent must not copy the earlier "api_key_pools with raw JSON credentials" design.
