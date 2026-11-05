# The Scenes — Independent Review Action Plan

**Review Date:** 1 November 2026  
**Status:** IN PROGRESS  
**Owner:** This file tracks completion of all findings from the independent project review.

---

## Critical Findings Summary

- ✅ **Good:** Phase plan, design-first approach, cost-safety rules are solid
- ⚠️ **Main Risk:** Documentation conflicts (pricing, plans, features)
- 🔴 **Urgent:** Old code history may contain secrets, pricing documents contradict each other
- 📋 **Next:** Fix documentation conflicts before any implementation work

---

## Section 4: Fix First (Before More Building)

### 4.1 Old Code History Security Scan ⚠️ CRITICAL

**Status:** SCAN COMPLETE — historical credential revocation/rotation confirmation required
**Risk Level:** CRITICAL — Repository is public with old history

**Actions Required:**
1. Use checksum-verified official Gitleaks v8.30.1 from https://github.com/gitleaks/gitleaks
2. Run full history scan with 100% secret redaction
3. Scan the current working tree separately
4. Document only redacted findings in `SECURITY-SCAN-RESULTS.md`
5. Rotate ANY found secrets immediately
6. Enable GitHub secret scanning (Settings → Code security)
7. Enable push protection (Settings → Code security)
8. Review and close 16 open pull requests

**Completion Criteria:**
- [x] Working-tree Gitleaks scan shows zero findings
- [x] Full-history scan completed (13 redacted legacy findings)
- [ ] All historical hosted Supabase credentials revoked/rotated by the account owner
- [ ] GitHub secret scanning enabled
- [ ] Push protection enabled
- [ ] PR review complete

---

### 4.2 Pricing Documentation Conflicts ⚠️ CRITICAL

**Status:** COMPLETED 5 November 2026 for the Phase 3/local-proof boundary
**Risk Level:** CRITICAL — Agents will build wrong thing

**Found Conflicts:**

| Document | Native Hosting? | Pro Storage | Free Fee | Status |
|---|---|---|---|---|
| RES-002 (Oct 31) | ✅ YES — 300GB Pro, 1TB Pro Plus | 300GB | — | OLD |
| PRICING-MONETIZATION.md | ❌ NO — external only | N/A | TBD/5%/7% | CORRECTED? |
| PRICING-COST-RESEARCH.md (Oct 29) | ❌ NO — not recommended | N/A | 5% | RESEARCH |

**Math Problems Found:**
- 300GB at $0.015/GB = $4.50/month cost (Pro price $19 → 76% margin, below 70% rule)
- 1TB at $0.015/GB = $15/month cost (Pro Plus price $39 → 61% margin, FAILS 70% rule)
- Month-1 revenue: stated $570, actual $770 (30% error)
- Break-even: stated $1,000, actual $950
- Year-1 projection: used month-12 count for all 12 months
- Paystack GH₵3 transfer fee makes "free" payouts unprofitable on small amounts

**FOUNDER DECISIONS REQUIRED:**
1. **Do Pro/Pro Plus include native video & file hosting?**
   - Option A: NO (external embedding only) → keeps 85%+ margins
   - Option B: YES (limited quotas) → requires reduced storage limits

2. **What is the Free plan sales fee?**
   - Current options: 3%, 5%, or 7%
   - Recommendation: 5% (incentivizes upgrade, still competitive)

3. **Final pricing approval:**
   - Pro: $19/month (GH₵300)
   - Pro Plus: $39/month (GH₵620)
   - With or without native hosting?

**Actions After Decisions:**
1. Create single authoritative COST-MODEL.md (use new document provided)
2. Mark PRICING-COST-RESEARCH.md as SUPERSEDED with date
3. Update PRICING-MONETIZATION.md to match decisions
4. Update RES-002 in OPEN-PRODUCT-DECISIONS.md
5. Rebuild revenue projections with corrected math

**Completion Criteria:**
- [ ] Founder decisions documented
- [ ] Single cost model document created
- [ ] All pricing docs aligned
- [ ] Math verified at 70%+ margin
- [ ] Storage quotas proven profitable

---

### 4.3 Lost Decision Records ⚠️ HIGH

**Status:** NOT STARTED  
**Risk Level:** HIGH — Missing 10+ critical decisions

**Missing Decisions:**
- OPD-005 through OPD-014 (text says "continued unchanged" but missing)
- OPD-016 (Free plan fee)
- RES-003 example (dollar amounts show backslash instead)

**Actions Required:**
1. Check Git history for original OPD-005 to OPD-014 text
2. Restore from commit history or founder's notes
3. Fix RES-003 transaction example
4. Update OPD-015 status to RESEARCH COMPLETE
5. Add OPD-016 for Free plan fee decision

**Completion Criteria:**
- [ ] All OPD-005 to OPD-014 restored
- [ ] OPD-016 added
- [ ] RES-003 example corrected
- [ ] OPD-015 marked complete

---

### 4.4 Project Setup Mismatch ⚠️ HIGH

**Status:** IN PROGRESS — Bun-only cleanup completed 4 November 2026  
**Risk Level:** MEDIUM — local checks pass; clean-clone/CI reproducibility remains unproven

**Current state:**
- `src/` exists and the Phase 2 frontend is accepted
- `typecheck` exists and passes
- Bun 1.4.4 is pinned through `packageManager`
- `bun.lock` is the sole lockfile and carries the current `the-scenes` project name
- `bun install --frozen-lockfile` passes
- clean-clone/CI reproduction remains to be verified

**Actions Required:**
1. Verify a clean checkout/fresh install reproduces lint, typecheck, build and tests.
2. Confirm CI uses Bun and the frozen lockfile.
3. Add a runtime-version file only if CI/hosting evidence requires it.

**Completion Criteria:**
- [x] Single lockfile (bun.lock only)
- [x] packageManager field set
- [x] typecheck script added
- [ ] Fresh clone passes: install → lint → typecheck → build
- [ ] CI passes or explicitly skips build steps

---

### 4.5 Hosting Plan Mismatch ⚠️ MEDIUM

**Status:** NOT STARTED  
**Risk Level:** MEDIUM — May hit Cloudflare limits, untested

**Problems Found:**
- Docs say "static hosting only" (Cloudflare Pages free)
- Setup builds Workers server app (10ms CPU limit, 3MB size)
- SSR typically uses 10-20ms per request (would exceed free limit)
- Tests run against dev server, not built app
- Nitro adapter is beta version

**Actions Required:**
1. **Founder Decision:** Pages (static) or Workers (server)?
2. Build app with `bun run build`
3. Measure:
   - Bundle size (must be < 3MB for free Workers)
   - CPU time per SSR request (must be < 10ms for free)
4. Document decision in DECISIONS.md with measurements
5. Budget for Workers Paid ($5/month) if needed
6. Pin Nitro adapter version exactly
7. Add CI step that tests built output (not just dev server)
8. Prebuild marketing pages as static where possible

**Completion Criteria:**
- [ ] Hosting decision documented
- [ ] Build measurements recorded
- [ ] Nitro version pinned
- [ ] CI tests built output
- [ ] Budget confirmed for paid plan if needed

---

### 4.6 Supabase Free Tier Risk ⚠️ MEDIUM

**Status:** NOT STARTED  
**Risk Level:** MEDIUM — Data loss risk, no backups

**Problems Found:**
- Free tier pauses after 7 days inactivity
- No automatic backups on free tier
- Only 2 projects allowed
- Docs contradict: some say "free default", others say "paid required"
- No backup/restore test documented

**Actions Required:**
1. **Founder Decision:** Budget for Supabase Pro ($25/month) for production
2. Create PRODUCTION-MINIMUM.md document specifying:
   - Supabase Pro required for live site
   - Daily backups, 7-day retention minimum
   - Backup testing schedule (monthly)
   - Usage monitoring owner
3. Use free tier for dev/staging only
4. Set up backup alerts
5. Test restore procedure before launch
6. Define 450MB write-stop procedure (who monitors, who acts)

**Completion Criteria:**
- [ ] Production minimum documented
- [ ] Supabase Pro budgeted
- [ ] Backup test passed
- [ ] Monitoring owner assigned
- [ ] Free tier limited to non-production

---

### 4.7 Referral Rewards Double-Payment Risk ⚠️ HIGH

**Status:** NOT STARTED  
**Risk Level:** HIGH — Financial loss, incorrect accounting

**Problems Found:**
- Sample code: check then add (race condition)
- No transaction protection (can credit twice)
- Rewards like "+5,000 live minutes" = entire free tier pool
- "+2GB storage" = 20% of free storage
- If native hosting removed, storage rewards meaningless
- Rewards stored as total (not ledger list)
- Cannot undo or expire individual grants
- Four different status lists across docs

**Actions Required:**
1. Wait for 4.2 pricing decision (affects reward types)
2. Redesign reward data model:
   - Store as list of grants (not total)
   - Each grant: id, referral_id, type, amount, granted_at, expires_at
   - Aggregate on read
3. Make crediting atomic (single transaction)
4. Add concurrency tests (fire 2 simultaneous credits, verify only 1 succeeds)
5. Add crash/retry tests
6. Choose ONE status list, update all docs
7. Remove impossible rewards (5,000 minutes if free tier can't provide)

**Completion Criteria:**
- [ ] Pricing decision made (4.2 complete)
- [ ] Ledger-style data model designed
- [ ] Atomic crediting implemented
- [ ] Concurrency test passes
- [ ] Single status list across all docs
- [ ] Reward types match available resources

---

### 4.8 Folder Structure Mismatch ⚠️ MEDIUM

**Status:** NOT STARTED  
**Risk Level:** MEDIUM — Imports break, secret leak risk

**Problems Found:**
- Docs say routes in `src/app/routes`
- TanStack Start default: `src/routes`
- Styles: `src/styles/globals.css` (docs) vs `src/styles.css` (config)
- Vite expects `src/server` entry (Phase 3)
- Secret adapters in shared `services/` could bundle to browser
- Naming: docs say PascalCase, examples use kebab-case

**Actions Required:**
1. Pick ONE folder layout:
   - Option A: Follow TanStack Start defaults (`src/routes`, `src/styles.css`)
   - Option B: Customize config to match docs
2. Update either docs or config to match
3. Name server-only files `*.server.ts`
4. Add Vite config rule blocking `**/*.server.*` from client
5. Add import test: try importing `foo.server.ts` from page, verify build fails
6. Consistent naming convention (recommend: PascalCase components, kebab-case files)
7. Remove provider-specific adapter names until providers chosen

**Completion Criteria:**
- [ ] Single folder layout documented
- [ ] Docs and config aligned
- [ ] `*.server.ts` protection tested
- [ ] Naming convention chosen
- [ ] Import violation test passes

---

### 4.9 Documentation Size & Duplication ⚠️ MEDIUM

**Status:** NOT STARTED  
**Risk Level:** MEDIUM — Agent confusion, contradictions

**Problems Found:**
- ~235KB across 24+ files
- Multiple indexes disagree (docs/README.md vs FOLDER-STRUCTURE.md)
- Checkmarks/symbols damaged (? instead of ✓, garbage characters)
- Three task-prompt formats
- Required-screen lists differ (14 admin sections vs 9)
- "Self-hosting capability" claimed but not designed
- FABLE.md duplicates content, model-specific name
- No CLAUDE.md (needed for Claude Code 2.1.277+)

**Actions Required:**
1. Create single authoritative index in docs/README.md
2. Fix UTF-8 encoding:
   - Re-save all .md files as UTF-8 with BOM
   - Add CI check for invalid characters
   - Search for `?` and `??` symbols, replace with correct checkmarks
3. Merge FABLE.md into AGENT-CONTEXT.md or rename to ORCHESTRATOR-GUIDE.md
4. Create one-line CLAUDE.md: `@AGENTS.md`
5. Align required-screen lists (AGENTS.md vs DESIGN-FIRST.md)
6. Choose ONE task-prompt template
7. Remove "self-hosting" claim or design it properly

**Completion Criteria:**
- [ ] Single index, all links work
- [ ] UTF-8 encoding verified
- [ ] Checkmarks fixed across all files
- [ ] FABLE.md merged/renamed
- [ ] CLAUDE.md created
- [ ] Screen lists aligned
- [ ] Self-hosting claim resolved

---

### 4.10 Security Rules Too Thin ⚠️ CRITICAL

**Status:** NOT STARTED  
**Risk Level:** CRITICAL — Security gaps before payments/content

**Missing Security Rules:**
- Embedded content policy (YouTube/Docs links are "anyone with link")
- Paid content leak prevention
- Script injection sanitization
- Permission table (who can do what)
- Admin two-factor authentication
- Upload file scanning
- Privacy/GDPR compliance (Ghana, Nigeria, EU)
- Data retention policy
- Backup and restore procedures
- Illegal content reporting
- Money-handling licenses (may need legal review)
- Incident response plan

**Actions Required:**
1. Expand SECURITY-RULES.md with numbered, testable rules
2. Create permission table:
   - Roles: learner, creator, community_owner, moderator, admin
   - Actions: view, post, edit, delete, monetize, moderate, admin
3. Define embed policy:
   - Allowed domains whitelist
   - Sandboxed iframes required
   - "Unlisted" YouTube requirement for paid content
4. Add XSS sanitization rules for user posts
5. Define admin security requirements (2FA, IP restrictions)
6. Privacy policy requirements (data location, retention, user rights)
7. **LEGAL REVIEW REQUIRED:** Money-handling licenses for Ghana/Nigeria before Phase 7

**Completion Criteria:**
- [x] SECURITY-RULES.md expanded (numbered, testable rules)
- [x] Permission table complete for Phase 3
- [x] Embed/external-link policy documented
- [x] XSS/structured-content rules defined
- [x] Privacy/retention requirements and production blockers listed
- [x] Money-handling legal/security review required before Phase 7

---

## Section 5: Fix Before Real Users or Money

### 5.1 Phase Plan Gaps

**Status:** NOT STARTED

**Problems:**
- Only Phases 1-2 have exit tests
- Storage mentioned Phase 3, R2 arrives Phase 4
- Password reset needs Resend (Phase 4) but login is Phase 3
- Rate limiting needs Redis (Phase 4) but login Phase 3
- Checkout Phase 7, payouts Phase 8 (creators earn but can't withdraw)
- Telegram bot (Phase 4 per RES-001) missing from Phase 4 list
- Phase 5 has 13 items including DMs
- No pricing/upgrade screens in Phase 1
- "Launch" undefined
- Plans reference features from future phases

**Actions:** Expand PHASES.md (separate task)

---

### 5.2 to 5.12

**Status:** NOT STARTED  
**Actions:** Will be addressed after Section 4 complete

---

## Progress Tracking

### Completion Status
- [ ] 4.1 Scan complete; historical credential revocation/rotation confirmation pending
- [ ] 4.2 Pricing conflicts (BLOCKED: founder decisions)
- [ ] 4.3 Lost decisions
- [ ] 4.4 Setup mismatch — IN PROGRESS; local Bun cleanup complete, clean-clone/CI proof pending
- [ ] 4.5 Hosting plan
- [ ] 4.6 Supabase plan
- [ ] 4.7 Referral rewards
- [ ] 4.8 Folder structure
- [ ] 4.9 Documentation cleanup
- [x] 4.10 Security rules

### Blocker Summary
- ✅ **Pricing direction resolved for current planning:** ADR-029–030; later payment implementation
  still requires a current cost-model check
- 🔴 **Blocking Phase 3A implementation:** final revision-3 technical review and local-isolation Wave 0
- 🟡 **Parallel incident / blocks hosted production:** revoke/delete and review any still-existing
  legacy hosted project; old accounts/credentials are permanently forbidden
- 🟡 **Gate evidence:** 4.4 fresh-install/CI verification
- 🟡 **Should Fix Soon:** 4.3, 4.7, 4.8, 4.9

---

## Next Steps

1. **IMMEDIATE:** Present founder with Section 9 decisions (pricing, hosting, native storage)
2. **THEN:** Run security scan (4.1)
3. **THEN:** Fix setup (4.4) so CI can pass
4. **THEN:** Address remaining Section 4 items
5. **FINALLY:** Move to Section 5 before any user-facing work

---

**Last Updated:** 2026-11-01  
**Next Review:** After founder decisions received
