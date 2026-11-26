# P4-S4 evidence — WhatsApp direct-chat feedback (code/local)

**Date:** 2026-11-26
**Slice:** P4-S4 — Replaceable feedback channel
**Approval:** ADR-048 (code/local; remote actions NONE)
**Target:** local code and fixture browser only. No provider contacted. No message sent. No hosted
project mutated. Supersedes the Telegram adapter evidence in `2026-11-11-p4-s4-feedback`.

## Why this change

The Telegram adapter could not be enabled without a bot token and a founder-approved chat, so the
founder chose a zero-cost replacement: a direct `wa.me` chat to his own WhatsApp. WhatsApp has no free
server-to-person API, so the adapter prepares the message and hands control to the sender; it never
claims a message was delivered.

## Implemented

- `src/features/feedback/whatsapp.ts` (client-safe): number normalization
  (`/^\+?[1-9]\d{7,14}$/`, strips spaces/dots/dashes/parentheses, `00` → `+`), `buildWhatsAppLink`,
  and `buildFeedbackWhatsAppText` with an 1800-character body cap.
- `src/server/feedback/feedback-config.server.ts`: `FEEDBACK_PROVIDER=whatsapp` + normalized
  `WHATSAPP_FEEDBACK_NUMBER`. An incomplete config is `misconfigured`; the retired `telegram` value
  also fails closed instead of silently switching channels.
- `src/server/feedback/feedback-provider.server.ts`: `WhatsAppFeedbackProvider` returns a `handoff`
  receipt whose `reference` is the prepared `wa.me` link.
- `src/features/feedback/contracts.ts`: third delivery value `handoff` (alongside `provider` and
  `local-preview`), plus the category enum.
- `src/features/feedback/feedback-form.tsx`: green **WhatsApp direct** badge, one-tap
  **Open WhatsApp directly** anchor, category select, in-app submit, and an honest handoff receipt
  ("Your note is ready in WhatsApp") with an **Open WhatsApp** link.
- `src/routes/help.tsx`: new "Talk to the founder" heading and signed-in viewer context.
- `.env.example`: `FEEDBACK_PROVIDER` / `WHATSAPP_FEEDBACK_NUMBER` contract; no token or secret.
- `docs/WHATSAPP-FEEDBACK-SETUP.md` replaces `docs/TELEGRAM-FEEDBACK-SETUP.md`.
- `e2e/feedback-whatsapp.spec.ts`: env-gated browser proof, skipped unless WhatsApp is selected.

## Pre-filled message

The prepared text contains the category, the internal route, the absolute page URL when the browser
knows it, an ISO timestamp and a request reference. The browser path adds the signed-in sender's
name/email because the sender reviews the text before pressing Send; the server path deliberately
excludes the email.

## Behavior guarantees

| Situation | Behavior |
| --- | --- |
| `FEEDBACK_PROVIDER` unset | `memory` provider; `local-preview` (never claims delivery) |
| `FEEDBACK_PROVIDER=whatsapp`, valid number | returns `handoff` with a prepared `wa.me` link |
| `FEEDBACK_PROVIDER=whatsapp`, number missing/invalid | `misconfigured`; submissions fail closed with `UNAVAILABLE` |
| `FEEDBACK_PROVIDER=telegram` (retired) | `misconfigured`; no silent channel switch |
| Fixture/no mode configured | anonymous submission accepted without constructing a Supabase client |
| Rate limited | `RATE_LIMITED` (unchanged `feedback` policy) |
| Malformed input | rejected by the shared schema before the provider runs |

## Verification

| Check | Result |
| --- | --- |
| `bun run test:unit` | 273 passed, 0 failed (23 files) |
| `bun run typecheck` | clean |
| `bun run build` | success |
| `bunx eslint` on this slice | clean |
| `bun run lint` (global) | blocked — remaining errors are in files other agents are editing |
| `e2e/feedback-whatsapp.spec.ts` | 6 passed, 0 failed (desktop, tablet, mobile × link + handoff) |

Browser run used an isolated dev server on port 5050 (port 5000 was held by another agent) with
`FEEDBACK_PROVIDER=whatsapp` and the founder's number supplied only through the environment. The
server log recorded `feedback_accepted provider=whatsapp delivery=handoff route=/help` once per
viewport. A first run failed only because concurrent agents' edits triggered full-page HMR reloads
mid-test and because the test's badge locator collided with "Open WhatsApp directly"; both were
corrected and the re-run is clean.

Environment: Bun 1.4.4, Node v26.12.1, TypeScript 5.9.3, Playwright 1.64.1 (Chromium).

## Security review summary

- The WhatsApp number is a public feedback contact, not a credential; no token or key exists.
- Secret values are never returned to the client; only the public number is exposed.
- Input is length-bounded and validated; submissions stay rate limited.
- No silent fallback from a broken WhatsApp config to a fake success.
- Critical findings: 0. High findings: 0.

## Not run / not authorized

- No real message sent; sending is the founder's own action inside WhatsApp.
- No hosted variable configuration, no deployment.
- Global `bun run lint` is not green because concurrent agents are mid-edit in unrelated route files;
  those files were not modified.
- ADR-041 Wave 5 capacity/recovery remains deferred.

## Rollback

Set `FEEDBACK_PROVIDER=memory` (or unset it) and redeploy. The form falls back to the local-preview
inbox and states plainly that nothing was delivered. No remote state exists to undo.