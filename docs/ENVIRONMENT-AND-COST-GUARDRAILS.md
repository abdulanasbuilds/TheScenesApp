# The Scenes � Environment and Cost Guardrails

## Purpose

This document defines the strict rules for managing environments, costs, secrets, and provider spending.

## Hard rule

**Default to zero-cost operation wherever technically and contractually feasible.**

## Zero-cost mode principles

1. No paid subscriptions without explicit founder approval
2. No paid API calls without explicit founder approval
3. No automatic upgrades to paid tiers
4. No hidden background usage
5. No unexpected billing
6. No automatic failover from free to paid
7. Track primary and reward infrastructure separately
8. Fail safely when free capacity is exhausted

## Provider cost classification

### Zero-cost (Free tier)

- Cloudflare Pages (deployment)
- Cloudflare R2 (10 GB/month, 1M Class A ops, 10M Class B ops)
- Supabase Free (500 MB database, 1 GB storage, 2 GB egress)
- Resend Free (100 emails/day, 3,000/month)
- Bunny.net (potentially free tier for video,interactive live streaming[ checking from official platform if its supported or not before using it] CHECK CURRENT TERMS)
- GitHub Actions (2,000 minutes/month for free accounts)

### Usage-based (Pay per use)

- LiveKit (after free 5,000 participant-minutes)
- Daily (after free 10,000 minutes/month)
- Agora (after free 10,000 minutes/month)
- Cloudflare Workers (after free 100,000 requests/day)
- Supabase Pro (if database exceeds 500 MB or needs more)

### Fixed subscription

- Supabase Pro ($25/month) � only if needed
- Other paid tiers � require approval

## Cost approval matrix

| Action                 | Approval required | Notes                   |
| ---------------------- | ----------------- | ----------------------- |
| Use free tier          | No                | Document limits         |
| Upgrade to paid tier   | **YES**           | Founder must approve    |
| Add new provider       | **YES**           | Evaluate cost first     |
| Enable usage-based API | **YES**           | Document per-call cost  |
| Deploy to production   | **YES**           | May trigger costs       |
| Enable auto-scaling    | **YES**           | Can cause runaway costs |

## Environment separation

### Development (local)

- Runs on `localhost:5000`
- Uses fixture data (Phase 2)
- No real provider credentials (Phase 2)
- Real provider test accounts (Phase 3+, free tiers only)

### Staging (Cloudflare Pages preview)

- Preview deployments for PRs
- Free tier only
- Test credentials (not production)
- Limited to Cloudflare free allowance

### Production (not yet active)

- Real user data
- Real provider accounts
- Monitoring and alerts
- Cost tracking
- Requires founder approval to activate

## Secret management

### What counts as a secret

- API keys
- Service-role tokens
- Database passwords
- Webhook secrets
- OAuth client secrets
- Encryption keys
- Bot tokens (Telegram, etc.)
- Payment processor keys

### Where secrets live

**Allowed:**

- Local `.env.local` (gitignored)
- GitHub Actions secrets
- Cloudflare Pages environment variables (encrypted)
- Supabase project settings (encrypted)

**FORBIDDEN:**

- Committed to Git
- Hardcoded in source code
- Stored in `api_credentials JSONB` database columns
- Logged to console/files
- Sent to client/browser
- Stored in localStorage/sessionStorage

### Secret rotation

- Rotate secrets immediately if compromised
- Rotate secrets on schedule (quarterly for high-privilege keys)
- Never reuse secrets across environments
- Never share production secrets with developers

## Provider budget tracking

### Primary infrastructure

Track separately:

- Cloudflare usage (Pages, R2, Workers)
- Supabase usage (database size, storage, egress)
- Resend usage (emails sent)
- Redis usage (if activated)

### Reward infrastructure (Phase 5+)

Track separately:

- Video provider usage (LiveKit/Daily/Agora/Bunny)
- Live session minutes consumed
- Storage used for reward-eligible content
- Per-creator usage vs. entitlement

**Critical rule:** A creator's referral reward does NOT automatically create provider capacity. Always check global capacity before honoring entitlements.

## Cost guardrails

### Cloudflare R2

- Free tier: 10 GB/month storage
- **Guardrail:** Reject uploads when approaching 9 GB (90% of free tier)
- **Action:** Inform user, require founder approval to upgrade or add account

### Supabase Free

- Free tier: 500 MB database, 1 GB storage
- **Guardrail:** Reject new data when database > 450 MB or storage > 900 MB
- **Action:** Require founder approval to upgrade to Pro

### Resend Free

- Free tier: 100 emails/day, 3,000/month
- **Guardrail:** Queue emails when approaching daily limit, fail if monthly limit hit
- **Action:** Require founder approval to upgrade

### LiveKit/Daily/Agora (Phase 6+)

- Free tiers: ~5,000�10,000 minutes/month
- **Guardrail:** Reject new sessions when approaching 90% of free allowance
- **Action:** Require founder approval to enable paid usage

## Spending caps (when technically possible)

- Set hard spending caps on provider dashboards where available
- Enable billing alerts at 50%, 75%, 90% of budget
- Disable auto-recharge/auto-upgrade
- Review usage weekly during active development

## If spending cannot be prevented

Some providers (usage-based APIs, pay-per-call services) cannot enforce hard caps at the code level.

**In these cases:**

1. Document the risk clearly
2. Implement rate limiting
3. Implement usage tracking
4. Set up billing alerts
5. Define the safest available guardrail (e.g., reject after N requests/day)
6. Explain to founder that a malicious actor could still trigger costs

Never promise a hard spending cap unless the implementation can technically enforce it.

## Abuse prevention

### Rate limiting (Phase 4+)

Use Redis for:

- API rate limits (e.g., 100 requests/hour per user)
- Auth attempt limits (e.g., 5 login attempts/15 min)
- Email send limits (prevent spam)
- Referral link generation limits

### Quota enforcement (Phase 5+)

- Creators cannot exceed their entitlements
- Global capacity is checked before honoring entitlements
- Suspicious usage patterns trigger review
- Referral rewards can be reversed for fraud

### DDoS protection

- Cloudflare provides basic DDoS protection
- Rate limit API endpoints
- Use Cloudflare bot management if needed (may have cost)

## Monitoring and alerts

### Required monitoring (Phase 3+)

- Provider usage dashboards
- Cost tracking
- Error rates
- Database size
- Storage usage
- Email quota
- Live session minutes (Phase 6+)

### Alert thresholds

- 50% of free tier used ? INFO
- 75% of free tier used ? WARNING
- 90% of free tier used ? CRITICAL
- Unexpected API errors ? CRITICAL
- Unusual spending pattern ? CRITICAL

### Alert destinations

- Telegram (internal feedback channel)
- Founder email
- GitHub Issues (for non-urgent)

## Cost review cadence

- **Daily:** Check usage during active development
- **Weekly:** Review all provider dashboards
- **Monthly:** Full cost reconciliation
- **Quarterly:** Re-evaluate provider choices and pricing

## Provider account ownership

### Development/staging accounts

- Owned by The Scenes (business entity)
- Credentials in approved secret storage
- Shared team access where appropriate

### Production accounts

- Owned by The Scenes (business entity)
- Billing email: business email (not personal)
- Payment method: business payment method
- Founder has admin access

### Creator-facing accounts (reward infrastructure)

**FORBIDDEN:**

- Automated creation of free accounts to evade limits
- Sharing credentials across unrelated creators
- Account farming
- Terms of service violations

**ALLOWED (if provider permits):**

- Multiple approved accounts for legitimate capacity pooling
- Documented account ownership
- Proper credential separation

## Deprecation and cleanup

When a provider is no longer needed:

1. Export all data
2. Delete resources
3. Remove credentials from secret storage
4. Cancel subscription
5. Update documentation
6. Archive account details

## Agent cost responsibilities

When an agent proposes adding a provider or service:

1. Research current pricing
2. Document free tier limits
3. Explain cost implications
4. Propose guardrails
5. Never assume founder approval
6. Never enable paid usage without explicit approval

## Cost violation consequences

If unauthorized spending occurs:

1. Disable the integration immediately
2. Document what happened
3. Review recent changes
4. Identify the root cause
5. Implement additional guardrails
6. Report to founder

## Emergency cost controls

If costs are unexpectedly high:

1. Check provider dashboards
2. Identify the source (which service, which endpoint)
3. Disable the integration if necessary
4. Review recent deployments
5. Check for DDoS or abuse
6. Contact provider support if needed
7. Implement emergency rate limits

## Documentation requirements

For every provider integration:

- Document in `docs/INTEGRATIONS.md`
- Note free tier limits
- Document guardrails
- Document cost per unit (if usage-based)
- Document approval status
- Document current usage tracking method

## Phase-specific cost rules

### Phase 0-2 (Documentation + Frontend)

- **Zero cost** (static hosting only)
- No provider credentials needed

### Phase 3 (Backend Foundation)

- Supabase Free tier
- Cloudflare R2 free tier
- Zero cost if usage stays within limits

### Phase 4 (Email/Files/Notifications)

- Resend free tier
- Redis free tier (if using managed Redis)
- May need founder approval for Redis provider

### Phase 5 (Creator Operations)

- Still within free tiers
- Referral system tracks entitlements (no provider cost yet)

### Phase 6 (Live/Video)

- **Requires founder approval**
- Video providers have usage-based costs
- Must implement strict guardrails

### Phase 7 (Payments)

- **Requires founder approval**
- Payment processors charge fees
- Must implement idempotent webhook handling
- Reconciliation required

### Phase 8+ (Marketplace, AI)

- **Requires founder approval for each integration**
- AI providers have per-token costs
- Marketplace may have transaction fees

## Cost optimization

- Use caching to reduce API calls
- Compress images/assets
- Use CDN for static content (Cloudflare free)
- Batch operations where possible
- Clean up unused data
- Archive old data
- Use database indexes
- Optimize queries
- Use worker/edge functions (Cloudflare free tier)

## Founder approval checklist

Before requesting approval for paid usage:

- [ ] Document exact cost structure
- [ ] Show projected monthly cost
- [ ] Propose spending cap
- [ ] Show usage tracking method
- [ ] Propose guardrails
- [ ] Explain why free tier is insufficient
- [ ] Show alternatives considered
- [ ] Document rollback plan
