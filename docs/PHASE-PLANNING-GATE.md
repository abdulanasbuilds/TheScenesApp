# The Scenes — Mandatory Phase Planning Gate

**Decision date:** 4 November 2026  
**Applies to:** every current and future phase  
**Long-term scale direction:** millions of registered accounts over time; not a claim of millions of simultaneous users

## Purpose

No phase moves directly from an idea or phase heading into implementation. Each phase must first be
documented, reviewed and explicitly approved. The plan must show how the phase works today, how it
fails safely and how it can grow without forcing a full rewrite.

Planning for scale does not mean prematurely building every distributed-system feature. It means:

- no known architectural dead end for the approved long-term direction;
- measurable capacity assumptions rather than phrases such as “internet scale”;
- stable ownership, tenant and authorization boundaries;
- bounded reads/writes and migration paths;
- evidence from tests before making capacity or reliability claims.

No plan can guarantee that millions of users will experience “no issues.” The required standard is a
well-reasoned architecture, explicit risks, staged load evidence, monitoring, recovery and a safe path
to increase capacity when measurements justify it.

## Phase states

Every phase uses these states:

1. **Proposed** — objective exists, planning has not started.
2. **Planning** — specification and evidence are being developed; no implementation.
3. **Review** — plan is complete enough for product, architecture, security, cost and operations review.
4. **Approved** — founder approves the defined scope and constraints.
5. **Implementing** — only approved work is being built.
6. **Verifying** — tests, browser/runtime checks, security checks and load evidence are being gathered.
7. **Accepted** — exit criteria pass and remaining risks are documented.

An approved plan can be amended, but a material scope, provider, data, security, scale or cost change
returns the affected section to Review before implementation continues.

## Required plan contents

### 1. Outcome and business context

- problem being solved;
- target user and buyer, where different;
- measurable value: time saved, revenue, trust, learning outcome or risk reduction;
- approved user workflows;
- success and failure measures;
- why this work belongs in the current phase.

### 2. Scope control

- in-scope behavior;
- explicit non-goals;
- dependencies and blocked decisions;
- existing implementation to preserve;
- later-phase features that must remain untouched;
- reversible versus irreversible actions.

### 3. Product and interaction contract

- routes/screens and state transitions;
- loading, empty, error, unauthorized and degraded states;
- mobile/low-bandwidth behavior;
- accessibility requirements;
- user-facing copy for consequential actions;
- analytics/feedback needed to know whether the feature works.

### 4. Domain and data model

- entities, ownership and lifecycle;
- relationships and cardinality;
- tenant/workspace boundary;
- primary/foreign keys, uniqueness, nullability and checks;
- deletion, retention, anonymization and audit rules;
- transaction and consistency boundaries;
- idempotency and duplicate handling;
- migration, backfill, rollback/recovery and portability path;
- representative query patterns and justified indexes.

### 5. API and integration contracts

- consumers and trust boundaries;
- request/response schemas and validation;
- authentication versus authorization;
- pagination, filtering and ordering;
- errors, retries, timeouts and idempotency;
- rate limits and abuse controls;
- version/backward-compatibility policy;
- provider adapter and failure/degradation behavior;
- current official provider constraints and costs.

### 6. Security and privacy

- principal/resource/action permission matrix;
- object-level and tenant-level enforcement points;
- positive and negative authorization tests;
- secret and service-identity handling;
- input sanitization and output encoding;
- sensitive data classification and minimization;
- audit events and privileged-action controls;
- legal/privacy/safeguarding dependencies;
- threat/failure cases appropriate to the phase.

### 7. Scale and performance envelope

Every phase must quantify the relevant subset rather than inheriting “millions” as an untestable
slogan:

- registered accounts;
- monthly/daily active users;
- peak concurrent sessions;
- peak and sustained requests per second;
- read/write mix;
- records and bytes per principal/resource;
- expected growth per month/year;
- geographic distribution;
- background-job volume;
- realtime connections/messages where applicable;
- payload and upload sizes;
- retention window.

The phase plan then defines:

- user-visible latency budgets (p50/p95/p99 where justified);
- throughput and error-rate targets;
- representative data size and load-test shape;
- database query-plan and connection-pool checks;
- cache, queue and async-work boundaries;
- overload behavior, backpressure and graceful degradation;
- thresholds that trigger scaling, indexing, partitioning, archiving or provider changes;
- estimated infrastructure cost at test, launch and growth envelopes.

The long-term product target is millions of registered accounts. It does **not** imply millions of
simultaneous sessions, and it does not authorize launch-scale overengineering. Concurrency and active
usage are measured and scaled in stages.

### 8. Reliability and operations

- dependency and provider failure modes;
- timeout/retry/circuit-breaker behavior where useful;
- backup scope, recovery-point objective (RPO) and recovery-time objective (RTO);
- tested restore procedure;
- structured logs, metrics, traces and correlation IDs;
- service-level indicators and alerts;
- runbooks and ownership;
- rollout, feature flag, rollback and incident response;
- cost/spend guardrails.

### 9. Verification plan

- unit and domain tests;
- schema/constraint tests;
- authorization allow/deny tests;
- integration and contract tests;
- browser/end-to-end flows;
- accessibility and responsive checks;
- performance/query/load tests under documented conditions;
- backup/restore and migration rehearsal;
- final diff and changed-path review.

### 10. Acceptance and handoff

- objective pass/fail exit criteria;
- evidence locations;
- known limitations and residual risks;
- deferred work and owners;
- production/deployment approvals still required;
- documentation/decision records updated.

## Scale-safe architecture rules

Unless a reviewed plan justifies an exception:

1. Application requests are stateless; local process memory is never the durable source of truth.
2. Every collection/list endpoint is paginated and bounded.
3. Bulk work is chunked, resumable and idempotent.
4. Slow/non-critical work moves through a durable job/outbox boundary when the phase introduces it.
5. Caches improve speed but never become the only copy of durable data or the authorization source.
6. Tenant/workspace keys and ownership are explicit.
7. Database constraints protect durable invariants.
8. Query/index design follows real access patterns and is verified with representative data.
9. Realtime is selective; polling or broadcasting every row is not a default.
10. Provider-specific code stays behind an internal adapter.
11. Counters and aggregates are derived/reconcilable, not silently trusted client totals.
12. Financial, entitlement and audit history uses append-only/idempotent patterns.
13. Partitioning, microservices and multi-region writes are adopted only when measurements justify
    their operational cost; the initial model must leave a migration path.
14. Security, correctness and privacy are never weakened for a benchmark.

## Approval record required per phase

Before implementation, the phase specification must include:

```text
Planning status: REVIEWED
Founder approval: APPROVED / NOT APPROVED
Approved scope version/date:
Approved first vertical slice:
Production actions authorized: NONE unless explicitly listed
Known blockers:
Required re-review triggers:
```

Chat approval must be copied into the durable specification/decision register. Tool availability,
old code, placeholder routes or provider documentation never counts as approval.

## Current application

- Phase 2 was accepted on 4 November 2026.
- Phase 3A revision 3 Waves 1–4 are implemented and the learning vertical slice is accepted. Wave 5
  capacity/recovery evidence is deferred by founder decision under ADR-041 and remains a mandatory
  pre-launch/load/scale gate.
- THE SCENES Supabase project (`okdzuqgzgnmmbtjxdaci`) is the designated pre-production/final project;
  this is not production or deployment authorization. Old accounts/credentials remain forbidden.
- Phase 4 revision 2 is in Review. `docs/PHASE-4-PLAN-REVIEW.md` records the completeness review.
  Founder approval, first-slice selection and exact provider/remote permissions are still required
  before implementation.
