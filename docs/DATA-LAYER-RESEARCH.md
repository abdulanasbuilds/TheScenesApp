# The Scenes — Data Layer and Platform Research

**Research date:** 4 November 2026  
**Scope:** architecture and provider evaluation only  
**Implementation status:** no database, authentication service, provider account or secret was created  
**Decision status:** Supabase is founder-approved for the isolated local Phase 3A proof; revision 3
must pass final technical review and local-isolation Gate A before implementation

## Executive conclusion

**Approved proof direction: use Supabase for the local-only Phase 3 proof-of-fit and, if the proof
passes, separately consider it as the initial production data/auth platform.** Use its managed
PostgreSQL, Auth, Row-Level Security (RLS),
Realtime and migration tooling. Keep application code behind internal adapters and keep object
storage separate so the core remains portable.

Supabase is not recommended merely because it was named in older project documents. It wins the
current comparison because The Scenes has strongly relational data and authorization requirements:

- users can hold different roles in different workspaces and communities;
- communities, memberships, courses, modules, lessons, enrolments and progress are related;
- reactions, referrals, entitlements, moderation and later financial records need uniqueness,
  referential integrity, transactions and auditability;
- private communities and creator workspaces require object-level authorization;
- search and reporting need joins and aggregations;
- eventual payment, payout and entitlement ledgers must be transaction-safe.

**Neon is the runner-up.** It has excellent PostgreSQL portability, branching, low-cost development,
Cloudflare support and a newer managed authentication offering. However, Neon Realtime is still
documented as beta, makes no performance guarantees, has an unstable transport protocol and does
not yet support RLS. That is too much security and product risk for private community data unless The
Scenes builds and operates an additional server-authorized realtime layer.

**Free tiers are suitable only for development and proof-of-fit.** Supabase Free can pause after low
activity and has no managed daily backups. Production requires a separately approved paid plan,
backup/restore target, monitoring and measured regional latency.

Confidence: **high** on PostgreSQL as the correct data model; **medium-high** on Supabase as the best
current managed platform. Provider products and prices can change, so revalidate before a paid or
production commitment.

## What the platform must support

### Business and product needs

1. Public discovery of categories, communities, creators, courses and events.
2. Private and public communities with membership-specific permissions.
3. Creators who can own or help administer more than one community.
4. Structured courses: course → module → lesson → enrolment → learner progress.
5. Posts, comments, reactions, saves, follows and notifications.
6. Events, registrations and later attendance.
7. Creator workspaces, moderation and audit history.
8. Append-only referral entitlement records and, much later, financial ledgers.
9. Basic full-text search before any dedicated or AI-assisted search product.
10. A future organization/private-academy model without rewriting every scoped table.

### Technical and safety needs

- database-enforced foreign keys, uniqueness and checks;
- atomic multi-row transactions and idempotency;
- server-side authorization plus database defense in depth;
- positive and negative authorization tests;
- migrations and deterministic development seeds in Git;
- controlled realtime subscriptions rather than making every table live;
- exportability to standard PostgreSQL;
- backups with a tested restore path;
- safe operation from TanStack Start on a serverless/Cloudflare runtime;
- low-bandwidth responses and pagination;
- no secrets or privileged database credentials in the browser.

## Why PostgreSQL is the correct structure

The core model is relational, not a set of independent JSON documents. A user's ability to view a
post depends on membership in the post's community; course progress depends on both an enrolment and
a lesson that belongs to the enrolled course; creator permissions depend on workspace membership;
and referral grants require idempotent, reversible ledger entries.

PostgreSQL expresses those rules with primary keys, foreign keys, unique constraints, checks,
transactions and RLS. The database can reject invalid relationships even if a UI, API route or
background process contains a bug. JSONB remains useful for bounded metadata or versioned editor
content, but it must not replace relationships, roles, prices, quotas or status ledgers.

## Provider comparison

| Candidate | Relational integrity | Auth / authorization | Realtime | Fit with TanStack + Cloudflare | Portability / operations | Verdict |
|---|---|---|---|---|---|---|
| **Supabase** | Native PostgreSQL, constraints and transactions | Mature Auth integrated with PostgreSQL RLS; official policy-test workflow | Database changes, private Broadcast/Presence and authorized channels | Official TanStack Start SSR guide; HTTPS Data API is serverless-safe; direct PostgreSQL is also possible | SQL migrations, local stack, `pg_dump`, generated types; standard PostgreSQL | **Recommended** |
| **Neon + Managed Better Auth** | Native PostgreSQL; excellent branching | Auth data lives in PostgreSQL and can be paired with RLS | **Beta; no RLS, no performance guarantee, unstable transport protocol** as of research date | Strong Cloudflare/Hyperdrive and TanStack support | Strong PostgreSQL portability; usage-based paid plan and branches | **Runner-up; reassess after Realtime GA/RLS** |
| **Nhost / Hasura** | Native PostgreSQL | Zero-trust Hasura table/role permissions plus Auth | GraphQL subscriptions | Usable, but adds GraphQL/Hasura metadata and a second authorization model not present in this app | Local stack and migrations; paid backups | Viable, but more stack change with no decisive benefit over Supabase |
| **Cloudflare D1** | SQLite with foreign keys; each paid DB is capped at 10 GB | No PostgreSQL-style RLS; application/API must carry the tenant boundary | Requires other Cloudflare primitives for richer realtime | Excellent native Cloudflare fit | Time Travel is useful, but each DB is single-threaded and the design pushes toward sharding | Useful for edge-local cases, **not** the primary system of record |
| **Firebase / Firestore** | Document model; relationships and joins require denormalization/application logic | Firebase Rules are capable but queries must match rule constraints | Excellent client realtime/offline behavior | Good web SDK and a Johannesburg region | Read/write billing and document coupling; high migration cost away from Firestore | Region advantage does not outweigh poor domain fit |
| **Convex** | Transactional document model, not relational PostgreSQL | Authorization is application-function driven | Excellent reactive UX | Strong React/TypeScript experience | Proprietary data/runtime model; limited regions and weaker SQL portability | Not selected for the durable system of record |
| **Self-managed PostgreSQL** | Excellent | Fully controllable, but Auth/RLS/API/realtime must be operated | Must be built/operated | Technically compatible | Maximum portability and maximum operational burden | Defer until scale or compliance creates a real need |

## Current provider facts that affect the decision

### Supabase

- Official documentation includes a TanStack Start SSR path using `@supabase/supabase-js` and
  `@supabase/ssr` with cookie-based sessions.
- The Data API works over HTTPS and has built-in pooling, which fits serverless runtimes. Cloudflare
  Hyperdrive also supports Supabase if a later measured need justifies direct PostgreSQL access.
- RLS is a native PostgreSQL boundary. Supabase now explicitly recommends revoking broad default
  grants, enabling RLS, writing a policy per operation and testing allow/deny cases with pgTAP.
- Local development supports versioned migrations, deterministic seeds, local Auth/Realtime and
  generated TypeScript database types.
- Free currently includes two active projects, 500 MB database quota, 50,000 MAU, 5 GB egress,
  200 peak Realtime connections and two million Realtime messages. Free projects may pause after a
  low-activity seven-day period.
- Free does not include managed daily backups. Supabase recommends manual off-site dumps. Pro starts
  at $25/month for one Micro project within current included compute credits and provides seven days
  of daily backups. PITR is a separate, materially more expensive add-on.
- Available primary regions currently include London, Frankfurt and other regions, but no African
  region. Region choice is fixed for the project and must be tested from launch markets.

### Neon

- Free currently offers 1 GB PostgreSQL per project, 100 compute-unit hours, scale-to-zero,
  5 GB public transfer, branching, a six-hour history window and one manual snapshot.
- Paid Launch is usage-based with no monthly minimum. Neon has first-class Cloudflare Workers and
  Hyperdrive documentation.
- Managed Better Auth stores users and sessions in a `neon_auth` PostgreSQL schema and branches with
  the database. It is a strong option, but newer than the Supabase Auth path used in this evaluation.
- Realtime was still beta on 30 October 2026. It explicitly lacked RLS, billing, a stable transport
  protocol and performance guarantees. Private data can be exposed only through sealed,
  server-authorized queries; adopting that today would increase custom authorization work.
- Available regions include London and Frankfurt but no African region.

### D1, Firebase, Nhost and Convex

- D1's free database limit is 500 MB; paid databases are capped at 10 GB each. Each database is
  inherently single-threaded and processes queries one at a time. This is suited to many small
  edge databases, not this product's initial shared relational graph.
- Firestore is explicitly a schemaless document database. Its Rules are not filters: queries must be
  structured so every potential result satisfies the rule. It offers a Johannesburg region, but
  course/community/entitlement relationships would require duplication and application-enforced
  invariants.
- Nhost provides PostgreSQL, Auth, Hasura GraphQL permissions and a full local stack. Its permissions
  default to zero trust, but adopting it would make Hasura metadata/GraphQL a major architectural
  dependency. Free projects do not receive managed daily backups.
- Convex provides excellent transactional mutations and realtime behavior but uses a proprietary
  document/runtime model. Its listed regions do not include Africa, and non-US regions carry a
  documented surcharge.

## Recommended application architecture

```text
Browser / installed PWA
        |
        | HTTPS; secure session cookie
        v
TanStack Start server functions / routes (Cloudflare target)
        |-- validate input with Zod
        |-- authorize the use case
        |-- call a small internal repository/service interface
        v
Supabase Auth + PostgreSQL + RLS
        |-- user-scoped Data API calls retain the user's identity
        |-- private Realtime channels only where justified
        |-- server-only secret for narrowly scoped admin/background work
        v
External URLs at launch; R2 adapter later for approved platform objects
```

### Boundary rules

1. Prefer TanStack server functions for writes and sensitive reads. Client-side visibility checks are
   UX only.
2. User-scoped server calls should preserve the user's session so RLS remains active. A server secret
   bypasses RLS and is reserved for explicit administrative/background paths that perform their own
   authorization.
3. Keep provider clients inside `src/server` or `*.server.ts` modules behind interfaces. Route and UI
   code must not import a service-role/secret client.
4. Start with `supabase-js` and the Data API. Add a direct SQL driver, Hyperdrive or an ORM only after
   a query or transaction demonstrates a real need.
5. Use SQL migrations as the schema source of truth. Do not operate two competing migration systems.
6. Use Supabase-generated TypeScript types at the adapter boundary. They do not replace runtime Zod
   validation for untrusted input.
7. Use Realtime selectively for notifications or feed updates. Ordinary request/response reads remain
   simpler, cheaper and easier to authorize.
8. Do not store uploaded binaries in PostgreSQL. At launch, store validated external resource links.
   If platform-managed files are later approved, store only R2 object metadata and ownership in
   PostgreSQL.

## Proposed relational model

This is an implementation blueprint, not authorization to create the schema. Exact columns should be
settled in the Phase 3 specification and migrations.

### Identity and platform access

| Table | Ownership / cardinality | Important invariants |
|---|---|---|
| `profiles` | One row per Auth user | `id` references Auth user; normalized unique `handle`; public fields only |
| `creator_profiles` | Zero or one per profile | approval status is server-controlled; verification cannot be self-assigned |
| `platform_role_grants` | Zero or many per profile | admin/support roles granted and audited server-side; never trusted from editable user metadata |
| `user_interests` | Many-to-many profile ↔ category | unique `(user_id, category_id)` |
| `follows` | Many-to-many follower ↔ creator | unique pair; no self-follow |

Do not model `learner`, `creator` and `admin` as one global mutually exclusive role. A creator is also
a learner; workspace/community roles are scoped; platform administration is separate and privileged.

### Tenant-ready creator boundary

| Table | Ownership / cardinality | Important invariants |
|---|---|---|
| `workspaces` | Current personal creator workspace; future organization/private academy | stable tenant key; kind/status constrained |
| `workspace_memberships` | Many users ↔ many workspaces | unique `(workspace_id, user_id)`; role and status constrained; at least one owner maintained transactionally |
| `workspace_plan_entitlements` | One current entitlement snapshot per workspace plus later ledger source | never equate plan entitlement with provider capacity |

Using a small workspace root now avoids putting `creator_id` on every table and then rewriting those
relationships when organizations arrive. It does **not** enable Phase 10 organization features now.

### Taxonomy and communities

| Table | Ownership / cardinality | Important invariants |
|---|---|---|
| `categories` | Platform-managed taxonomy | unique normalized slug; active/sort state |
| `communities` | Many per workspace | unique slug; privacy and publication status constrained |
| `community_categories` | Many-to-many; one may be marked primary | unique pair; at most one primary category per community |
| `community_memberships` | Many profiles ↔ many communities | unique pair; role and membership status constrained |
| `community_invitations` | Community-scoped | hashed token, expiry, single acceptance, inviter audited |

### Community content

| Table | Ownership / cardinality | Important invariants |
|---|---|---|
| `posts` | Community + author | draft/published/hidden status; author and community immutable after publish unless a privileged workflow allows it |
| `comments` | Post + author; optional parent comment | parent must belong to same post; bounded nesting policy |
| `post_reactions` | User ↔ post | unique `(post_id, user_id, reaction_type)` |
| `comment_reactions` | User ↔ comment | unique `(comment_id, user_id, reaction_type)` |
| `saved_items` | User-owned | explicit supported resource types; unique user/resource pair |

Keep counters such as reaction totals as derived or reconciled cache fields, not the source of truth.
Do not put every reaction ID or comment tree inside a post JSON document.

### Courses and progress

| Table | Ownership / cardinality | Important invariants |
|---|---|---|
| `courses` | Workspace; optionally associated with a community | publication state; normalized slug within its scope |
| `course_modules` | Ordered children of course | unique `(course_id, position)` |
| `lessons` | Ordered children of module | unique `(module_id, position)`; content schema version recorded |
| `lesson_resources` | Many external resources per lesson | validated URL, kind and ordering; no secret access token in URL |
| `course_enrollments` | User ↔ course | unique pair; status and source constrained |
| `lesson_progress` | Enrolment ↔ lesson | unique pair; lesson must belong to enrolled course; `completed_at` agrees with status |

Progress percentages should be derived from lesson rows or maintained as a reconciled projection. Do
not rely on a client-supplied percentage as the durable truth.

### Events and notifications

| Table | Ownership / cardinality | Important invariants |
|---|---|---|
| `events` | Workspace; optional community | end after start; timezone identifier retained; publication state constrained |
| `event_registrations` | User ↔ event | unique pair; RSVP/attendance status constrained |
| `private.event_access` | One protected access record per event when needed | meeting link visible only to authorized server paths; never exposed in public event rows |
| `notifications` | User-owned projection | `read_at` timestamp rather than a mutable boolean; type and target metadata constrained |
| `notification_preferences` | One preference set per user | channel consent explicit; safe defaults |

### Operations, audit and future ledgers

| Table | Purpose | Important invariants |
|---|---|---|
| `audit_events` | Privileged and moderation action trail | append-only; actor, action, target and request correlation captured |
| `idempotency_keys` | Duplicate protection for commands/jobs | unique scope + key; result/status and expiry |
| `outbox_events` | Reliable follow-up work | written in same transaction as domain change; retry-safe |
| `referrals` / `referral_events` | Phase 5 referral state | no self-referral; unique referred user per programme; idempotent event key |
| `entitlement_grants` | Phase 5 append-only reward ledger | one grant per qualifying event; reversals are new rows, not destructive edits |
| financial ledger tables | Phase 7/8 only | integer minor units + ISO currency; immutable entries; balanced and idempotent |

Only Phase 3 tables should be created in Phase 3. Later tables are documented now so early identifiers
and ownership boundaries do not block them; they must not be implemented early.

## Data conventions and constraints

- Use UUID primary keys generated by the database; do not expose sequential business counts as IDs.
- Store timestamps as `timestamptz` in UTC; retain a user's/event's IANA timezone separately when
  local-time display or scheduling needs it.
- Store money later as integer minor units plus a three-letter currency code, never binary floating
  point.
- Use normalized lowercase slugs with database uniqueness and format checks.
- Use `NOT NULL` for required data and named checks for state/value invariants.
- Choose `ON DELETE` deliberately: cascade true component rows (module → lesson), restrict durable
  records (audit/ledger), and anonymize or retain content according to an approved deletion policy.
- Prefer explicit join tables over ID arrays in JSON.
- Use JSONB only for bounded metadata or versioned editor documents. Every JSON shape needs an
  application schema version and runtime validation.
- Keep private integration data and privileged helper functions in an unexposed `private` schema.
- Never store raw provider credentials, reset tokens or private object URLs in ordinary content rows.

## Critical query patterns and initial indexes

Indexes are driven by actual access paths and must be confirmed with representative data and
`EXPLAIN (ANALYZE, BUFFERS)` before production.

| Query | Initial index direction |
|---|---|
| Public community discovery by status/category | `communities(status, published_at desc)` plus `community_categories(category_id, community_id)` |
| Community feed | partial/composite index on `posts(community_id, pinned desc, created_at desc)` for visible statuses |
| Post comments | `comments(post_id, parent_comment_id, created_at)` |
| All communities for a user | `community_memberships(user_id, status, community_id)` in addition to unique community/user key |
| Workspace authorization | `workspace_memberships(user_id, status, workspace_id)` |
| Course library in a community | `courses(community_id, status, published_at desc)` |
| Learner's active courses | `course_enrollments(user_id, status, updated_at desc)` |
| Progress lookup | unique `lesson_progress(enrollment_id, lesson_id)` and an index beginning with `lesson_id` only if proven necessary |
| Upcoming events | `events(community_id, starts_at)` with a partial condition for scheduled/published rows |
| Unread notifications | partial index `notifications(user_id, created_at desc) where read_at is null` |
| Basic search | maintained `tsvector` plus GIN indexes on published searchable content |

Every foreign-key column used from the referencing side in joins or deletion checks should be reviewed
for an index; PostgreSQL does not add those indexes automatically.

## Authorization model

### Principals

- signed-out visitor;
- authenticated profile;
- active community member;
- community moderator/admin/owner;
- workspace editor/admin/owner;
- platform moderator/support/admin;
- server job/service identity.

### Core rules

| Resource/action | Visitor | Authenticated non-member | Active member | Scoped manager | Platform admin/service |
|---|---:|---:|---:|---:|---:|
| Read published public community metadata | Yes | Yes | Yes | Yes | Yes |
| Read private community content | No | No | Yes | Yes | Explicit privileged path only |
| Create a community post | No | No | If community policy permits | Yes | Normally no impersonation |
| Edit/delete a post | No | No | Own post within policy | Moderate within scope | Audited privileged path |
| Read own learning progress | No | Own only | Own only | Aggregates/assigned learners only | Audited privileged path |
| Change workspace/community roles | No | No | No | Owner/admin within allowed hierarchy | Audited + elevated auth |
| Read another user's notifications | No | No | No | No | Only explicit support/legal workflow |

Implementation requirements:

1. Enable RLS and restrict grants on every exposed table.
2. Write separate select/insert/update/delete policies where applicable.
3. Index membership and ownership columns used by policies.
4. Test owner, permitted member, signed-in stranger and anonymous cases.
5. Test both horizontal escalation (another user's object) and vertical escalation (member acting as
   moderator/admin).
6. Put security-definer helpers in a private, unexposed schema, set `search_path = ''`, schema-qualify
   every object and grant execute narrowly.
7. Never base RLS authority on user-editable metadata. Platform roles and memberships come from
   controlled tables or non-user-editable claims, with freshness limitations understood.
8. Admin operations require server-side authorization, elevated authentication and audit records;
   hiding an admin screen is not authorization.

## Development and migration approach

### Recommended tools

- Supabase CLI for local services, migrations, seeds, type generation and database tests.
- PostgreSQL SQL migrations as the authoritative schema history.
- `@supabase/supabase-js` and `@supabase/ssr` for TanStack Start sessions and user-scoped access.
- Zod (already present) for untrusted request validation.
- pgTAP through `supabase test db` for constraints and RLS allow/deny tests.
- Playwright for end-to-end auth and user-flow verification.
- `pg_dump` / `pg_restore` for portability and recovery exercises.
- Cloudflare Hyperdrive only if measured direct-SQL latency or connection behavior later justifies it.

Do **not** add an ORM merely to hide an unsettled schema. If complex server-only queries later justify
Drizzle or Kysely, keep SQL migrations authoritative and adopt one query layer, not several.

### Phase 3 proof-of-fit sequence

1. Complete the remaining Gate A safety work and write the approved vertical-slice specification.
2. Create a **local-only** Supabase configuration; no production project or credentials.
3. Implement identity/profile, workspace membership, one public/private community and community
   membership in migrations.
4. Add RLS/grants and pgTAP positive/negative tests in the same change.
5. Add deterministic fixture-equivalent seeds with no real personal data.
6. Connect one vertical slice: sign in → join/read community → enrol → complete lesson → reload and
   observe persisted progress.
7. Add selective private Realtime only after ordinary reads/writes and policies pass.
8. Generate TypeScript database types and keep provider code behind an adapter.
9. Run a portability exercise: logical dump and restore into a clean PostgreSQL/Supabase local stack.
10. Use a remote free **development** project only after explicit authorization. Measure latency from
    Accra, Lagos and Nairobi against candidate London/Frankfurt placement before production choice.

### Proof-of-fit exit criteria

- a clean checkout can start the local stack, apply every migration and seed deterministic data;
- SSR signup/login/logout/recovery/session-refresh paths are specified and tested;
- all RLS/grant tests include allowed and denied identities;
- the selected vertical slice persists correctly and passes browser tests;
- no service/secret key appears in browser bundles, logs, fixtures or Git;
- representative feed, membership and progress queries have acceptable plans;
- backup/export and restore are exercised, not merely documented;
- provider-specific code is confined to the adapter/server boundary;
- measured regional latency and a production backup tier are reviewed before launch.

## Region and African-first considerations

Neither Supabase nor Neon currently lists an African database region. Firestore lists Johannesburg,
but a closer region cannot compensate for a data model that weakens the product's relational and
ledger guarantees. For West African launch traffic, network routing may make London or Frankfurt
better than Johannesburg; that must be measured rather than guessed.

The application should:

- choose the database region closest to the application server and measured launch traffic;
- paginate feeds and select only needed columns;
- avoid large hydrated payloads and chatty N+1 queries;
- cache public, non-personal discovery responses at the edge where safe;
- never edge-cache private or user-specific responses without a proven cache key and policy;
- monitor p50/p95 API and database latency by region after a controlled pilot.

## Open decisions and risks

1. Production region after real latency tests; no Africa region is currently offered by Supabase.
2. Production plan/backup budget. Free remains development-only.
3. Recovery objectives: acceptable data-loss window (RPO) and restoration time (RTO).
4. Data retention, account deletion/anonymization and legal/privacy requirements.
5. Exact rich-content representation and sanitization policy.
6. Whether any client performs direct Data API writes or all writes pass through server functions;
   the recommendation is server-first with RLS defense in depth.
7. Whether future measured query needs justify a server-only SQL query builder/ORM.

## Sources

All sources were accessed 4 November 2026. Provider claims are from official documentation.

### PostgreSQL

- [Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### Supabase

- [Pricing](https://supabase.com/pricing)
- [Billing and current quotas](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Free-project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Database backups](https://supabase.com/docs/guides/platform/backups)
- [Available regions](https://supabase.com/docs/guides/platform/regions)
- [Row-Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Serverless drivers](https://supabase.com/docs/guides/database/connecting-to-postgres/serverless-drivers)
- [TanStack Start quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/tanstack)
- [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)

### Neon

- [Plans](https://neon.com/docs/introduction/plans) — last updated 23 October 2026
- [Regions](https://neon.com/docs/introduction/regions) — last updated 14 October 2026
- [Managed Better Auth](https://neon.com/docs/auth/overview) — last updated 29 September 2026
- [Realtime](https://neon.com/docs/realtime/overview) — beta, last updated 30 October 2026
- [Cloudflare Workers integration](https://neon.com/docs/guides/cloudflare-workers)

### Other candidates

- Cloudflare [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) and
  [Hyperdrive database support](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)
- Firebase [Firestore data model](https://firebase.google.com/docs/firestore/data-model),
  [Rules and queries](https://firebase.google.com/docs/firestore/security/rules-query),
  [pricing](https://firebase.google.com/docs/firestore/pricing) and
  [locations](https://firebase.google.com/docs/firestore/locations)
- Nhost [GraphQL permissions](https://docs.nhost.io/products/graphql/permissions),
  [local development](https://docs.nhost.io/getting-started/local-development/cli) and
  [backups](https://docs.nhost.io/products/database/backups)
- Convex [regions](https://docs.convex.dev/production/regions),
  [limits](https://docs.convex.dev/production/state/limits) and
  [backup/restore](https://docs.convex.dev/database/backup-restore)
