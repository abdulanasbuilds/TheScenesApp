# P4-S3 evidence — connected in-app notifications (code/local)

**Date:** 2026-11-11
**Slice:** P4-S3 — Connected in-app notifications
**Approval:** ADR-044 (code/local; remote actions NONE)
**Target:** local code and fixture browser only. No provider contacted. No Supabase project contacted.
No migration applied and no deployment.

## Implemented

- Additive migration `20261111120000_phase4_0019_notifications.sql`: `public.notifications` and
  `public.notification_preferences`, owner-only RLS, column-scoped grants, keyset/dedupe indexes, and one
  atomic trigger from `private.audit_events`.
- One notification per real caller-bound transition (`community.joined`, `course.enrolled`); dedupe by
  `'audit:' || event.id` with `on conflict do nothing`; `lesson.completed` default-off; `system` reserved.
- In-app preference is consulted with default-on when no row exists.
- Keyset cursor `"<createdAt>|<uuid>"`, validated and decoded in the input schema.
- `href` allowlist enforced in the database check and the client zod schema (no open redirect).
- `/notifications` connected page: loading, empty, all/unread, retry, unavailable, load-more pagination,
  mark-one/mark-all with pending guards, and redirect to `/login` on `UNAUTHENTICATED`.
- Shell unread badge comes from the connected root-loader summary, not fixture data.
- Settings → Notifications reads and saves connected preferences (9 explicit booleans; account/security
  mandatory in-app; email/push stored off by default). Fixture behaviour is unchanged.
- Generated `db/database.types.ts` extended by hand for the two tables (the generator needs Docker, which
  was unavailable).

## Verification

| Check                                             | Result                           |
| ------------------------------------------------- | -------------------------------- |
| `bun test tests/unit/p4-s3-notifications.test.ts` | 25 passed, 0 failed              |
| `bun run test:unit`                               | 237 passed, 0 failed (20 files)  |
| `bun run typecheck`                               | clean (app + scripts)            |
| `bun run lint`                                    | clean                            |
| `bun run verify:client-boundary`                  | pass                             |
| `bun run build`                                   | success                          |
| `bun run test:fixture`                            | 32 passed, 16 skipped (48 total) |
| `git diff --check`                                | clean                            |

Environment: Bun 1.4.4, Node v26.12.1, TypeScript 5.9.3, Playwright 1.64.1.

## Security review summary

- Both tables have RLS enabled; `anon` receives no grant; `authenticated` gets only `select` on
  notification read columns and `update(read_at)`.
- Policies are owner-only (`user_id = (select auth.uid()))`); tests assert their presence and that no
  anonymous grant exists.
- The audit trigger is `security definer` with `set search_path = ''` and execute revoked from `public`.
- Notification links are allowlisted in both the database and the client, preventing open redirects.
- The cursor is validated before use, so a tampered value is a safe validation error.
- Unexpected provider failures surface as a safe `UNAVAILABLE` state with no provider detail.
- Critical findings: 0. High findings: 0.

## Not run / not authorized

- **Local database gate (`bun run test:db`) not run:** the Docker daemon was unavailable
  (`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`). The live
  RLS/constraint allow-deny matrix and non-analyze `EXPLAIN` plans remain owed before this slice is
  database-verified.
- No hosted migration was written to or applied on THE SCENES or any project.
- No push/email provider exists; those preference columns store intent only.
- No deployment, load test or capacity claim (ADR-041 Wave 5 remains deferred).

## Files

- `supabase/migrations/20261111120000_phase4_0019_notifications.sql`
- `src/features/notifications/{contracts,cursor,schemas,notifications.functions}.ts`
- `src/server/repositories/notification.repository.server.ts`
- `src/server/services/notification.service.server.ts`
- `src/routes/notifications.tsx`, `src/routes/settings.tsx`, `src/routes/__root.tsx`
- `src/store/app-store.tsx`, `db/database.types.ts`
- `tests/unit/p4-s3-notifications.test.ts`
- `docs/NOTIFICATIONS.md`

## Rollback

Drop the `audit_events_create_notification` trigger, the `private.create_notification_from_audit_event()`
function and the two tables; revert the feature/server/route/store changes. No hosted state exists to
undo.
