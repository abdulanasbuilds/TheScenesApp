# P4-S3 hosted migration evidence

**Date:** 15 November 2026  
**Target:** THE SCENES (`okdzuqgzgnmmbtjxdaci`)  
**Authority:** founder explicitly requested MCP connection and all required Supabase migrations.  
**Contains secrets or customer data:** no.

## Action

- Configured the Supabase remote MCP for the exact project reference and verified the returned project
  URL before mutation.
- Compared local and remote migration history: remote had exactly 0001–0018; local 0019 was the only
  missing migration.
- Ran a CLI dry run against the exact project, then applied only
  `20261111120000_phase4_0019_notifications.sql` with no seeds, roles or vault changes.
- Confirmed the remote migration history now records exactly 0001–0019 with the repository timestamp.

## Verified database boundary

- `public.notifications` and `public.notification_preferences` exist and have RLS enabled.
- Owner-only policies exist for notification select/update and preference select/insert/update.
- `anon` has no column grants.
- `authenticated` can select notification read columns and update only `read_at`; preferences use
  explicit select/insert/update column grants and cannot write `updated_at` or ownership on update.
- `audit_events_create_notification` is enabled on `private.audit_events`.
- `private.create_notification_from_audit_event()` is `SECURITY DEFINER`, has an empty `search_path`,
  and is not executable by `public` or `authenticated`.
- Remote-generated TypeScript types now exactly match `db/database.types.ts`.
- Both hosted notification tables contain zero rows; no real user/customer data was introduced.

## Advisors

- No new notification security finding was reported.
- The two notification query indexes are reported unused because the tables are empty; retain them for
  the implemented keyset and unread queries.
- Existing unrelated advisories remain documented in the completion report; no unrelated database
  change was made during this migration.

## Remaining verification

- Application deployment was not performed.
- A connected two-user browser/RLS behavior matrix and representative-data query plans remain owed when
  approved fictional accounts/catalogue data are available.
- No Resend, Upstash, Telegram, Web Push or R2 action was performed.

## Post-migration regression

- remote-generated types exactly match `db/database.types.ts`;
- `bun run test:unit`: 268 passed, 0 failed;
- `bun run typecheck`: passed;
- `bun run build`: passed (Cloudflare module output);
- `bun run verify:client-boundary`: passed;
- changed-file ESLint and `git diff --check`: passed.
