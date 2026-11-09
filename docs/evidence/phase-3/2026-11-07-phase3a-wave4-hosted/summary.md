# Phase 3A Wave 4 hosted integration evidence

**Date:** 7 November 2026
**Target:** THE SCENES (`okdzuqgzgnmmbtjxdaci`), pre-production

## Hosted catalogue

The founder explicitly authorized loading the existing reviewed fictional catalogue after a row-count
check proved it was absent. The pinned CLI dry run proposed only `supabase/seed.sql`; the confirmed run
applied no migration and no role file.

Resulting deterministic catalogue:

- 3 fictional, non-login catalogue actors plus the founder-controlled test profile;
- 3 workspaces;
- 5 categories;
- 2 communities;
- 2 courses;
- 4 modules;
- 7 lessons and 7 lesson-content rows;
- 4 external HTTPS resources;
- no seeded learner, membership, enrolment, completion, payment, or customer record.

## Connected application

- Public Explore, category filtering, community metadata, course outlines, lesson outlines, and preview
  content now come from Supabase under RLS.
- Connected state never falls back silently to fixture catalogue data.
- Join, leave, enrol, complete, joined communities, My Learning, and progress use server functions and
  caller-bound database commands.
- Private community children are concealed from strangers.
- Public preview lesson content is visible; protected bodies/resources remain absent until authorized.
- External resources use HTTPS anchors with `target="_blank"` and `rel="noopener noreferrer"`.
- Posts, events, member lists, notifications, marketplace, and creator operations remain visibly
  unavailable/fixture-only per the approved Phase 3 matrix.

## RLS and command verification

Two remote transactions used authenticated-role claims for fictional catalogue profiles and rolled
back every mutation.

Verified:

- public discovery returns the two listed communities;
- join, enrol, and complete succeed for the allowed public path;
- user B sees zero user-A membership/enrolment rows;
- user B completion returns `forbidden`;
- private/invite-only direct join returns concealed `not_found`;
- duplicate join/enrol/complete calls return `changed: false` and do not duplicate rows/audits;
- leaving preserves enrolment/completion history, reduces product-design content visibility to the one
  preview lesson, and blocks new protected completion;
- rejoin restores all four product-design lesson bodies;
- exactly five state-change audits exist for join, enrol, complete, leave, and rejoin in the rolled-back
  idempotency scenario.

## Verification

- unit suite: `177 passed`, `0 failed`;
- TypeScript: passed;
- ESLint: passed;
- client/server boundary scan: passed;
- production Cloudflare-module build: passed;
- fixture regression: `26 passed`, `4 intentional duplicate viewport skips`, `0 failed`;
- hosted public connected suite: `12 passed` across desktop, tablet, and mobile;
- anonymous membership server-function POST: HTTP `401`;
- security/health advisors: no Critical/High finding and no health finding.

The remaining security warnings are documented constraints: intentional caller-bound SECURITY DEFINER
commands, deny-all private audit RLS, and leaked-password protection unavailable below Supabase Pro.
See:

- <https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy>
- <https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable>
- <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>

No credential, token, password, secret key, confirmation URL, or customer data is recorded here.

## Remaining Wave 4 browser evidence

The founder-controlled account did not establish an active Supabase session in the shared browser
(`auth.sessions` reported zero active sessions), so the authenticated UI replay was not captured. The
same authorization and persistence transitions passed at the hosted database/RLS boundary above, but
that is not represented as a substitute for the pending authenticated browser replay.
