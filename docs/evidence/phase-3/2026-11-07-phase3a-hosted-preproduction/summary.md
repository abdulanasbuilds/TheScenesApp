# Phase 3A hosted pre-production migration evidence

**Date:** 7 November 2026
**Target:** THE SCENES (`okdzuqgzgnmmbtjxdaci`)
**Classification:** pre-production; no production deployment or customer data
**Pinned CLI:** Supabase CLI `3.0.0`

## Preflight

- MCP target matched the approved THE SCENES project reference.
- CLI link matched the same project name and reference.
- Remote public tables: `0`.
- Remote migration-history entries: `0`.
- Remote development branches: `0`.
- Security, performance and health advisor findings: `0`.
- Local migration files: exactly `18`.
- `git diff --exit-code 2d58659..HEAD -- supabase/migrations`: passed; no accepted migration changed after Wave 1 promotion.
- Static migration scan found no seed operation, destructive table/schema statement, extension creation, role creation or migration-history repair.

## Remote dry run

Command:

```text
bun node_modules/supabase/dist/supabase.js db push --dry-run --remote
```

Result:

- dry run: `true`;
- target: linked THE SCENES project;
- proposed migrations: the 18 accepted `phase3a_0001` through `phase3a_0018` files in timestamp order;
- proposed seeds: none;
- proposed roles: none;
- unrelated or destructive operation: none;
- remote mutation from dry run: none.

## Migration deployment

The first non-dry-run invocation omitted `--yes`; CLI v3 displayed the exact target and proposed
18-migration mutation, then refused because agent-mode confirmation was required. It explicitly
reported that nothing changed. After that confirmation was inspected, the already-authorized command
was repeated with `--yes`:

```text
bun node_modules/supabase/dist/supabase.js db push --remote --yes
```

Result:

- exactly 18 accepted migrations applied in timestamp order;
- seeds: none;
- roles: none;
- reset/drop/history repair: none;
- target: THE SCENES (`okdzuqgzgnmmbtjxdaci`) only.

## Post-migration database verification

- Migration-history entries: exactly `18`, versions `20261105120000` through `20261105121700`.
- Tables: 15 expected `public` tables plus `private.audit_events`; all have RLS enabled.
- Rows after migration: `0` on every application table; no seed ran.
- Client table-level write grants: `0`.
- Non-approved client column writes: `0`.
- Profile updates are limited to `bio`, `display_name`, `headline`, and `location`.
- Handle has no client update grant.
- The own-profile UPDATE policy has both `USING` and `WITH CHECK`.
- The Auth profile trigger exists, is enabled, and calls `private.handle_auth_user_created`.
- All approved SECURITY DEFINER functions pin `search_path = ''` and revoke PUBLIC execution.
- The four public command functions derive identity from `auth.uid()` and are executable by
  `authenticated` only, not `anon`, `PUBLIC`, or `service_role`.
- `private.audit_events` has no client grant and no policy by design.

## Advisors

No Critical or High finding exists.

Security:

- INFO: `private.audit_events` has RLS with no policy. This is intentional deny-all defense in depth;
  the table also has no client grants. Remediation reference:
  <https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy>.
- WARN: the four authenticated command RPCs are SECURITY DEFINER. This is intentional and the
  introspection checks above prove caller-bound identity, empty search paths, and exact execution ACLs.
  Remediation reference:
  <https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable>.

Performance:

- INFO: five foreign-key index hypotheses were reported for Wave 5 query-plan evaluation:
  <https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys>.
- INFO: new indexes are unused because every application table is empty; no index was removed:
  <https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index>.
- WARN: four SELECT surfaces use multiple deliberate permissive policies; Wave 5 measures their plans
  before consolidation:
  <https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies>.
- Health findings: none.

## Hosted environment and Auth configuration

- `.env.staging.local` contains only the staging mode, approved project URL and one enabled modern
  publishable key; it is ignored by `*.local` and was not printed or committed.
- Legacy anon and secret keys were not selected.
- Email/password Auth is enabled.
- Confirm Email remains enabled.
- Site URL is `http://127.0.0.1:5000/login`.
- Additional redirect allow-list includes `http://127.0.0.1:5000/**`.
- The URL update changed only those two Auth URL properties; nine undeclared hosted properties,
  including email confirmation, remained unchanged.

## Founder-reported manual email confirmation

After checkpoint `82cb6dd`, the founder completed the real-inbox browser flow and reported that every
step worked:

- registration showed the honest check-email state;
- login was blocked before confirmation;
- the confirmation email returned to the application login page;
- password login succeeded after confirmation;
- the confirmed account reached onboarding.

The founder did not share the email address, password, confirmation URL or token. This is manual
founder-reported evidence; automated hosted negative/security coverage remains a separate gate.

No credential, database URL, access token, password, JWT, cookie or confirmation token is recorded here.
