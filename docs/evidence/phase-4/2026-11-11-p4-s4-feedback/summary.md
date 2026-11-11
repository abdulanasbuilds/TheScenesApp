# P4-S4 evidence — replaceable feedback channel (code/local)

**Date:** 2026-11-11
**Slice:** P4-S4 — Replaceable feedback channel
**Approval:** ADR-044 (code/local; remote actions NONE)
**Target:** local code and fixture browser only. No provider contacted. No bot created. No message
sent. No hosted project mutated.

## Implemented

- `src/features/feedback/schemas.ts`: bounded, server-validated submission contract (message length,
  category enum, optional contact address, `route` restricted to a safe internal path, honeypot field).
- `src/features/feedback/contracts.ts`: the shared result contract (`ok` / typed failure) with codes
  limited to `UNAUTHENTICATED|FORBIDDEN|NOT_FOUND|CONFLICT|RATE_LIMITED|UNAVAILABLE`.
- `src/features/feedback/feedback.functions.ts`: `createServerFn` entry point wrapped by
  `withSafeHandler`, so no internal error text reaches the client.
- `src/features/feedback/feedback-form.tsx`: accessible form (labelled fields, inline errors, disabled
  submit while pending) mounted on `/help`.
- `src/server/feedback/feedback-config.server.ts`: reads `FEEDBACK_PROVIDER` from the merged runtime
  environment and resolves `memory` (default) or `telegram`.
- `src/server/feedback/feedback-provider.server.ts`: `FeedbackProvider` interface with two
  implementations. `memory` is the local-preview inbox; `telegram` posts to the founder-approved
  internal chat using `TELEGRAM_BOT_TOKEN` and `TELEGRAM_FEEDBACK_CHAT_ID`.
- `src/server/feedback/feedback.service.server.ts`: resolves the principal only in a connected mode
  (fixture/absent mode resolves to an anonymous submission without throwing), applies the shared
  `feedback` rate-limit policy (already published by P4-S2), and never falls back from `telegram` to
  `memory`.

## Behavior guarantees

| Situation | Behavior |
| --- | --- |
| `FEEDBACK_PROVIDER` unset | `memory` provider; delivery state `local-preview` (never claims a human received it) |
| `FEEDBACK_PROVIDER=telegram` and both variables present | posts to the internal chat; failures return `UNAVAILABLE` |
| `FEEDBACK_PROVIDER=telegram` and a variable missing/invalid | reported `misconfigured`; submissions fail closed with `UNAVAILABLE`; **never** downgraded to `memory` |
| Fixture/no mode configured | anonymous submission accepted; no Supabase client is constructed |
| Rate limited | returns `RATE_LIMITED` |
| Malformed input | rejected by the shared schema before the provider is called |

The delivery status of a `memory` submission is `local-preview`, which explicitly does not assert that
a person received the message.

## Route-echo hardening

`/help` reads the current path from `useRouterState((state) => state.location.href)`. In
`@tanstack/react-router`, `state.location.search` is an object, so the previous
`${pathname}${search}` would have sent `pathname[object Object]`; `href` is the origin-less
path + search + hash that the feedback schema accepts. The schema additionally rejects any value that
is not a safe internal path, so the field cannot be used for an open redirect or data exfiltration.

## Verification

| Check | Result |
| --- | --- |
| `bun test tests/unit/p4-s4-feedback.test.ts` | 14 passed, 0 failed |
| `bun run test:unit` | 264 passed, 0 failed (23 files) |
| `bun run typecheck` | clean |
| `bun run lint` | clean |
| `bun run verify:client-boundary` | pass |
| `bun run build` | success |
| `git diff --check` | clean |

Environment: Bun 1.4.4, Node v26.12.1, TypeScript 5.9.3, Playwright 1.64.1.

## Security review summary

- The bot token and chat ID are read only on the server and never returned to the client.
- Input is length-bounded and validated; the honeypot field suppresses trivial bots.
- Submissions are rate limited by the shared `feedback` policy.
- A misconfigured Telegram channel fails closed; there is no silent path to a fake success.
- Critical findings: 0. High findings: 0.

## Not run / not authorized

- No Telegram bot created, no token held, no real message sent.
- No provider account, no hosted project mutation, no deployment.
- Account email is owned by Supabase Auth custom SMTP and is out of scope here.
- ADR-041 Wave 5 capacity/recovery remains deferred.

## Rollback

Remove `/help`'s `FeedbackForm`, the `src/features/feedback/*` and `src/server/feedback/*` modules, and
the `feedback` rate-limit policy. Unset `FEEDBACK_PROVIDER` if it was set. No remote state exists to
undo.
