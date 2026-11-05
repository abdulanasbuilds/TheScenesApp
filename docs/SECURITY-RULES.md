# The Scenes — Security and Privacy Rules

**Last reviewed:** 5 November 2026
**Current implementation boundary:** Phase 3A revision 3 is awaiting re-review and founder approval.
Documentation and local configuration-safety corrections may proceed; no Supabase stack, migration,
hosted project, credentials, production data, payments, deployment, or provider-side mutation is
authorized.

This document defines testable security rules. `AGENTS.md`, the current phase specification, and the
current user instruction remain higher authority. A later phase must extend this document before it
introduces a new trust boundary.

## 1. Core rules

1. **SEC-001 — Deny by default.** A principal receives only the operations explicitly required by an
   approved workflow.
2. **SEC-002 — UI is not authorization.** Hidden controls and protected routes improve UX but never
   replace server/database enforcement.
3. **SEC-003 — Authenticate at the endpoint.** Every server function that reads or mutates private
   data validates the session itself.
4. **SEC-004 — Authorize the object.** Every operation checks the caller against the requested row,
   workspace, community, enrolment, or other resource.
5. **SEC-005 — Preserve tenant scope.** Workspace/community IDs supplied by a client are selectors,
   not proof of membership.
6. **SEC-006 — Validate every untrusted input.** Server-function data, URL/search parameters, provider
   payloads, metadata, and database-function inputs have bounded runtime schemas.
7. **SEC-007 — Minimize data.** Collect, return, log, and retain only what the approved workflow needs.
8. **SEC-008 — Least privilege.** Database grants, function execution, provider keys, GitHub
   permissions, and service identities are narrow and environment-specific.
9. **SEC-009 — No silent bypass.** A privileged key or RLS-bypassing identity must never be used to
   make an ordinary user flow work.
10. **SEC-010 — Security changes require negative tests.** An allow-path test alone is insufficient.

## 2. Data classification

11. **SEC-011 — Public data:** published community/course metadata and deliberately public profile
    fields only.
12. **SEC-012 — Account data:** email, session state, membership, enrolment, progress, preferences,
    and private profile fields are not public.
13. **SEC-013 — Sensitive data:** credentials, recovery material, moderation evidence, private
    messages, payment/payout data, legal requests, and precise security telemetry receive restricted
    storage and access.
14. **SEC-014 — Secrets are never application content.** Secret values must not be stored in JSONB,
    profile metadata, content rows, analytics payloads, fixtures, screenshots, or logs.
15. **SEC-015 — No real personal data in local seeds.** Local/test data is fictional and deterministic.

## 3. Phase 3A revision-3 permission matrix

Phase 3 implements only the learner proof. Creator role management, platform administration,
moderation, payments, and impersonation remain out of scope.

| Resource/action | Visitor | Signed-in stranger | Active member/learner | Scoped manager | Platform admin/service |
|---|---:|---:|---:|---:|---:|
| Read published listed catalogue metadata, regardless of content privacy | Allow | Allow | Allow | Allow | No special bypass needed |
| Read unlisted/concealed community/course metadata | Deny | Deny | Allow only in own active scope | Allow only in managed scope | Deferred audited path |
| Read public profile projection (`id,handle,display_name,headline,bio,location`) | Allow | Allow | Allow | Allow | No special bypass needed |
| Read private account/profile fields | Deny | Own only | Own only | Own only | Deferred support/legal path |
| Update profile | Deny | Own allowed fields only | Own allowed fields only | Own allowed fields only | Deferred |
| Join/rejoin published listed public open community | Deny | Self only | Idempotent self operation | Not required | No impersonation |
| Join unlisted/invite/private community | Deny | Concealed deny | Existing active membership no-op only | Seed/setup only | Deferred |
| Leave community | Deny | Own absent/left is safe no-op | Own active member → left | Manager path deferred | No impersonation |
| Enrol in included accessible course | Deny | Self only | Idempotent self operation | Own learner account only | No impersonation |
| Read own enrolment/completion history | Deny | Own only | Own only | No individual learner access in Phase 3A | Deferred audited path |
| Read non-preview lesson body/resources or complete lesson | Deny | Active enrolment + active course-community membership | Same | No individual learner access in Phase 3A | Deferred audited path |
| Create/edit catalogue or role assignments | Deny | Deny | Deny | Seed/setup only in Phase 3 | Deferred |
| Read or write audit history directly | Deny | Deny | Deny | Deny | Deferred controlled tooling |

16. **SEC-016 — Test principal classes.** Every Phase 3 table/command tests anonymous, owner, allowed
    member, signed-in stranger, paused/banned member, and elevated/setup identities where relevant.
17. **SEC-017 — No existence leak.** A private resource that the caller cannot access returns the same
    safe not-found response as a missing resource.
18. **SEC-018 — No self-promotion.** Users cannot assign or restore their own manager, owner, moderator,
    admin, status, plan, entitlement, or verification state.

## 4. Authentication and sessions

19. **SEC-019 — Provider-approved password handling only.** The application never stores or hashes raw
    passwords itself.
20. **SEC-020 — Verified server identity.** Supabase SSR code uses `auth.getClaims()` to verify identity;
    it never authorizes from `auth.getSession()` or an unverified cookie payload.
21. **SEC-021 — Request-scoped client.** A fresh user-scoped Supabase client is created per request and
    carries only the publishable key plus the caller's cookie state.
22. **SEC-022 — No privileged Auth client in the Phase 3 app.** Local setup/test tooling may use an
    ephemeral local secret outside the app only when explicitly documented; application runtime may not.
23. **SEC-023 — Cookie propagation is complete.** All refreshed cookies and cache-control headers from
    `@supabase/ssr` are copied to the response.
24. **SEC-024 — Private responses are not shared-cacheable.** Authenticated and session-changing
    responses use `Cache-Control: no-store` (or an equally strict reviewed policy) and vary safely.
25. **SEC-025 — CSRF protection stays enabled.** Defining `src/start.ts` must explicitly install
    TanStack Start's `createCsrfMiddleware()` for server functions.
26. **SEC-026 — Auth errors resist enumeration.** Login uses the same user-facing message for an
    unknown account and an invalid password. Signup exposes only provider-safe conflict information.
27. **SEC-027 — Auth inputs are bounded.** Email, password, handle, display name, and payload sizes are
    validated before calling Auth.
28. **SEC-028 — Logout is server-mediated.** Logout clears/revokes the current session and its cookies;
    clearing UI state alone is not logout.
29. **SEC-029 — Recovery is honest.** Phase 3 does not claim an email was delivered. Production recovery
    and email verification remain blocked until the email phase and anti-abuse controls are approved.
30. **SEC-030 — Auth abuse is a production blocker.** The loopback proof adds the numeric process-local
    development limiter defined by revision 3 and retains provider defaults as defense in depth. This is
    not a distributed/production control. Approved edge/application limits and direct-provider abuse
    controls must be implemented and tested before any hosted/public authentication endpoint is enabled.

## 5. PostgreSQL, grants, RLS, and functions

31. **SEC-031 — RLS on every exposed table.** Every table in an exposed schema enables RLS before it is
    reachable by `anon` or `authenticated`.
32. **SEC-032 — Grants and policies are paired.** Each table migration revokes broad defaults, grants
    the minimum operation/columns, creates per-operation policies, and adds matching tests.
33. **SEC-033 — Restrict default privileges.** New public tables, sequences, and functions are not
    automatically exposed to `anon`, `authenticated`, or `PUBLIC`.
34. **SEC-034 — Internal helpers are unexposed.** Membership/authorization helpers live in `private`,
    which is not listed as a Data API schema.
35. **SEC-035 — Prefer security invoker.** A function is `SECURITY DEFINER` only when a documented RLS
    recursion or atomic command requires it.
36. **SEC-036 — Harden every definer function.** It uses `SET search_path = ''`, schema-qualified names,
    no unsafe dynamic SQL, explicit `auth.uid()` ownership checks, explicit execute revocation, and
    allow/deny tests.
37. **SEC-037 — No editable authorization metadata.** `raw_user_meta_data`, profile fields, URL data,
    and client context never grant roles or tenant access.
38. **SEC-038 — Direct writes are closed unless intentional.** Phase 3 membership, enrolment, progress,
    and audit writes go through narrowly granted database commands; direct table write grants remain
    revoked.
39. **SEC-039 — Database timestamps are authoritative.** Clients cannot choose audit, enrolment,
    completion, or status-transition timestamps.
40. **SEC-040 — Durable invariants are constraints.** Foreign keys, uniqueness, checks, and composite
    relationships reject cross-course progress and duplicate membership/enrolment/completion.
41. **SEC-041 — Audit history is not user writable.** Audit rows are inserted by controlled database
    commands/triggers and have no direct `anon`/`authenticated` read, update, insert, or delete grants.
42. **SEC-042 — Policies avoid recursion.** Cross-table membership checks use reviewed private helpers
    where required and are tested for `42P17` recursion failures.
43. **SEC-043 — RLS predicates are indexed.** Identity, membership, ownership, and status columns used
    by policies are indexed from the leading column where justified.

## 6. Input, content, links, embeds, and XSS

44. **SEC-044 — Structured content over raw HTML.** Phase 3 lesson content uses versioned structured
    blocks validated with Zod; arbitrary HTML/script/style input is not accepted or rendered.
45. **SEC-045 — Output is encoded by default.** User text is rendered as text through React. Any future
    rich-HTML renderer requires a reviewed allowlist sanitizer and XSS tests before activation.
46. **SEC-046 — External URLs are canonicalized.** Parse with a URL parser, require `https:`, reject
    credentials/control characters, bound length, and store the canonical form.
47. **SEC-047 — No secret-bearing links.** Content URLs must not include access tokens, signed private
    object URLs, credentials, or provider API keys.
48. **SEC-048 — Link is not access control.** “Unlisted,” “anyone with the link,” or an obscured URL is
    not treated as private-course protection; the UI tells creators this limitation.
49. **SEC-049 — Link navigation is isolated.** External links opened in a new tab use
    `rel="noopener noreferrer"`; user-supplied URLs never become executable schemes.
50. **SEC-050 — Embeds are allowlisted.** If a later phase enables inline embeds, providers and exact
    host patterns are approved explicitly; arbitrary iframe HTML is forbidden.
51. **SEC-051 — Embeds are sandboxed.** Future iframes receive the minimum `sandbox`, `allow`,
    referrer-policy, and origin permissions required by the approved provider.
52. **SEC-052 — No server-side fetch in Phase 3.** The local proof validates/stores external metadata
    but does not fetch arbitrary user URLs, preventing an unnecessary SSRF boundary.
53. **SEC-053 — Uploads remain disabled.** File type/size scanning and private-file access controls are
    Phase 4+ work and must be specified before any upload endpoint exists.

## 7. Secrets and supply chain

54. **SEC-054 — Secret locations are restricted.** Local secrets live only in ignored `.env.local`;
    future remote secrets use approved encrypted provider settings.
55. **SEC-055 — Publishable is not privileged.** A Supabase publishable key may be present in browser
    configuration under the provider model, but all security still comes from grants/RLS. Secret or
    service-role keys never reach the app/browser in Phase 3.
56. **SEC-056 — Fail closed on configuration.** Missing/malformed variables or a non-local Supabase URL
    stop the local proof with a safe configuration error.
57. **SEC-057 — Scan before credentials.** Full Git history and the working tree are scanned with a
    pinned, checksum-verified secret scanner before provider credentials are introduced.
58. **SEC-058 — Rotate, do not merely delete.** A discovered real credential is treated as compromised,
    rotated/revoked, and documented without reproducing its value.
59. **SEC-059 — Dependencies are minimal and pinned through Bun's lockfile.** New packages require a
    clear need, official provenance, compatible license/runtime, and vulnerability review.

## 8. Logging, audit, privacy, and retention

60. **SEC-060 — Safe structured logs.** Logs may contain timestamp, environment, request ID, operation,
    duration, result code, and non-sensitive resource type/ID.
61. **SEC-061 — Redact sensitive values.** Passwords, tokens, cookies, authorization headers, full
    emails, request bodies, SQL text, and secret values are never logged.
62. **SEC-062 — Correlation IDs are not authority.** A request ID is validated/generated for tracing but
    never used to authorize access.
63. **SEC-063 — Local proof retention.** Local accounts and data may be reset at any time; no real user
    data is permitted. Test artifacts that contain account data remain ignored and are deleted when no
    longer needed.
64. **SEC-064 — Production retention remains a gate.** Account deletion/anonymization, legal holds,
    backups, analytics retention, moderation evidence, and data-subject rights require founder/legal
    approval before hosted production.
65. **SEC-065 — No sensitive analytics.** Passwords, tokens, private content, precise payment data, and
    private learner activity are not sent to analytics/AI providers without an approved purpose and
    legal basis.

## 9. Privileged operations and administration

66. **SEC-066 — No Phase 3 admin bypass.** Platform-admin/service workflows and impersonation are not
    implemented in the local learner proof.
67. **SEC-067 — Future admin requires MFA.** Production platform-admin, payout, policy, role-grant, and
    secret-management operations require phishing-resistant MFA where supported, at minimum AAL2,
    plus recent re-authentication for consequential actions.
68. **SEC-068 — Privileged changes are audited.** Role, access, moderation, entitlement, financial, and
    support actions record actor, action, target, result, time, and correlation.
69. **SEC-069 — No silent impersonation.** Any future support impersonation requires explicit approval,
    reason, visible indication, expiry, and audit history.

## 10. Recovery, incidents, and safeguarding

70. **SEC-070 — Reproducible recovery.** The local proof must rebuild from migrations/seeds and complete
    a logical dump/restore rehearsal before acceptance.
71. **SEC-071 — Production RPO/RTO are unresolved.** They do not block the local proof but block hosted
    production approval.
72. **SEC-072 — Incident response is explicit.** On suspected exposure: stop the affected path, preserve
    non-sensitive evidence, revoke/rotate credentials, assess scope, notify the owner, remediate, and
    document follow-up.
73. **SEC-073 — Backups are protected data.** Dumps are ignored, access-restricted, never committed, and
    destroyed after an approved local rehearsal.
74. **SEC-074 — Minors require a separate review.** Direct messaging, public profiles, instructor
    contact, live sessions, payments, and behavioral tracking for minors remain disabled until legal,
    safeguarding, consent, reporting, and moderation controls are approved.
75. **SEC-075 — Illegal/abusive content handling is a later gate.** Public user-generated content,
    reports, appeals, blocking, and evidence retention require the Phase 5 moderation specification.
76. **SEC-076 — Money handling requires legal and security review.** Payments, payouts, refunds,
    chargebacks, KYC/AML, licensing, and webhook processing remain blocked until Phase 7 approval.

## 11. Phase 3A revision-3 binding clarifications

77. **SEC-077 — Local means loopback-isolated.** Vite, Supabase APIs, PostgreSQL, Studio, Mailpit and
    other local services must not be reachable from another machine. `0.0.0.0` and unrestricted host
    acceptance are forbidden for the proof.
78. **SEC-078 — Public outline is not public content.** Published/listed community, course, module and
    lesson outline metadata may be public. Non-preview lesson bodies and resource URLs require the
    caller's active enrolment and current active membership in the course's community.
79. **SEC-079 — Tenant relationships are structural.** A course cannot reference a community in another
    workspace, and a lesson cannot reference a module in another course; composite foreign keys enforce
    both boundaries.
80. **SEC-080 — Server-managed local cookies.** The no-Realtime proof uses host-only, `HttpOnly`,
    `SameSite=Lax`, `Path=/` cookies. `Secure` may be false only for approved loopback HTTP and must be
    re-reviewed before any HTTPS/hosted use.
81. **SEC-081 — Local logout scope is explicit.** Logout uses Supabase local scope, awaits completion,
    and propagates deletion of every chunked session cookie. Clearing React state is never logout.
82. **SEC-082 — Public build-time variables are validated before bundling.** Phase 3A accepts only the
    exact loopback URL and `sb_publishable_` key form. JWT, secret/service prefixes and secret-looking
    `VITE_` names fail the build and request-time guard.
83. **SEC-083 — Unexpected errors are contained.** Every public function uses the compiler-recognized
    chain `createServerFn(...).validator(nonThrowingTypedPassthrough).handler(withSafeHandler(...))`,
    importing `createServerFn` directly from `@tanstack/react-start`. `withSafeHandler` parses and maps
    validation/domain/Auth/provider/database failures inside the handler. A project wrapper factory is
    forbidden because the Start compiler does not transform it; a build test enforces the direct import
    and generated client stub. Global middleware only redacts/logs and emits the tested generic fallback
    for an escaped programming failure; it is not assumed to replace a typed TanStack handler result.
84. **SEC-084 — Fixture state never becomes local authority.** In `supabase-local` mode, fixture
    identity, membership, enrolment and progress cannot be rendered or used as authorization. Backend
    failure remains visible and never triggers a fixture fallback.
85. **SEC-085 — Unlisted is not link-based access.** Self-join/rejoin requires a published, listed,
    public, open community. Knowing an unlisted community UUID or URL never grants access.
86. **SEC-086 — Membership loss revokes included content.** Leaving, pausing or banning removes
    non-preview lesson/resource access and completion authority even when enrolment/progress history
    remains. An allowed rejoin restores access without erasing history.
87. **SEC-087 — Mutations are POST-only.** Signup, login, logout, profile update, join, leave, enrol and
    complete use POST server functions. GET is side-effect-free; wrong methods return 405.

## 12. Phase 3 verification checklist

- [ ] Full-history and working-tree secret scan completed with redacted evidence.
- [ ] Only local Supabase URL and publishable key are accepted; no app service/secret key exists.
- [ ] CSRF middleware is explicitly retained after `src/start.ts` is added.
- [ ] `getClaims()` protects every private server function.
- [ ] Private/session responses are non-cacheable and refresh cookies propagate correctly.
- [ ] Every exposed table has explicit grants, RLS, and allow/deny pgTAP coverage.
- [ ] Every definer function has pinned search path, explicit ownership checks, narrow execute grants,
  and direct-call negative tests.
- [ ] Cross-user, cross-community, cross-workspace, and cross-course attacks fail without existence
  leaks.
- [ ] Structured content and external URL rules pass validation/XSS tests.
- [ ] Logs and browser bundles contain no password, token, cookie, secret key, SQL text, or sensitive
  body.
- [ ] Local reset, dump, and restore are exercised and evidence is recorded.

## 13. Deferred legal/production decisions

The local proof does not settle privacy-law applicability, controller/processor agreements, regional
data placement, production retention, production RPO/RTO, minors policy, content-moderation process,
admin staffing, or money-handling obligations. These are explicit hosted-production blockers, not
assumptions the implementation may fill in.
