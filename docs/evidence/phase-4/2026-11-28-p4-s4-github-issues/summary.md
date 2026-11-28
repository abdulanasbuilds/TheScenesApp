# P4-S4 evidence — GitHub Issues feedback (code/local)

**Date:** 2026-11-28
**Slice:** P4-S4 — Replaceable feedback channel
**Approval:** ADR-049 (code/local; remote actions NONE)
**Target:** local code and fixture browser only. No GitHub repository contacted. No Issue created. No
hosted project mutated. Supersedes the WhatsApp direct-chat evidence in `2026-11-26-p4-s4-whatsapp`.

## Why this change

The WhatsApp direct-chat feedback backend made the founder the transport: nothing became a trackable
record until he opened the chat, and there was no shared status, label or history. Feedback needs a real
queue that the founder already knows how to run, without adding a database, an owner dashboard or a
paid form service. ADR-049 supersedes ADR-048.

## Implemented

- `src/features/feedback/contracts.ts`: nine categories (`general`, `bug`, `feature-request`,
  `complaint`, `payment`, `course`, `marketplace`, `events`, `community`); nine GitHub labels; title
  prefixes (`[BUG]`, `[FEATURE]`, etc.); platform areas; `FeedbackDelivery` is `provider` or
  `local-preview`; `submissionId` in the receipt.
- `src/features/feedback/schemas.ts`: zod schema with `category`, `subject`, `message`, `area`,
  `route` (internal-path only), `submissionId` (UUID), honeypot `company` (max 0).
- `src/features/feedback/feedback-form.tsx`: single form (category, subject, area, description),
  in-flight button lock, honeypot hidden field, honest success/failure copy, retry with the same
  `submissionId`. No GitHub repo/token/issue detail shown to users.
- `src/features/feedback/feedback.functions.ts`: `sendFeedback` server function and
  `getFeedbackProviderStatus` (state/provider/dataMode only; no secrets).
- `src/server/feedback/feedback-config.server.ts`: `FEEDBACK_PROVIDER=memory|github`; validates
  `GITHUB_FEEDBACK_REPO` (`owner/name`) and `GITHUB_FEEDBACK_TOKEN` (min 20 chars); misconfigured
  fails closed; never reads back the token.
- `src/server/feedback/github-issues.server.ts` (new): lean GitHub REST client over native `fetch`;
  builds `[PREFIX] Subject` title, labelled body with hidden `<!-- thescenes-submission:<id> -->`
  marker; best-effort dedupe search of recent issues before creating; 8-second timeout; classifies
  401/403/404/410/429/5xx/network errors without leaking status codes; reports success only on HTTP 201
  with a confirmed issue number.
- `src/server/feedback/feedback-provider.server.ts`: `MemoryFeedbackProvider` (bounded local inbox)
  and `GitHubIssuesFeedbackProvider` interface; `FeedbackMessage` carries subject/area/submissionId.
- `src/server/feedback/feedback.service.server.ts`: rate-limited (`feedback` policy), validates,
  builds minimized server context (no email/token/header), success only after provider confirms.
- `src/server/integrations/health.server.ts`: feedback health reports `ready`/`misconfigured`/
  `disabled`; required variables `FEEDBACK_PROVIDER`, `GITHUB_FEEDBACK_REPO`, `GITHUB_FEEDBACK_TOKEN`;
  no values echoed.
- `src/routes/help.tsx`: "Send feedback" form mounted at `/help#feedback`; removed WhatsApp copy and
  signed-in viewer email from the form.
- `src/components/layout/public-shell.tsx`: footer "The Scenes" column adds "Send feedback" link.
- `src/components/layout/creator-shell.tsx`: workspace nav and member dropdown add "Send feedback"
  links to `/help#feedback`.
- `src/components/ui/index.tsx`: `FeatureTeaserModal` request href updated to `/help#feedback`.
- `.env.example`: replaced WhatsApp placeholders with `GITHUB_FEEDBACK_REPO` / `GITHUB_FEEDBACK_TOKEN`
  / `GITHUB_FEEDBACK_API_BASE` placeholders (server-only).
- `docs/GITHUB-FEEDBACK-SETUP.md`: new runbook; `docs/WHATSAPP-FEEDBACK-SETUP.md` removed.
- `docs/DECISIONS.md`: ADR-048 marked superseded; ADR-049 added.
- `docs/INTEGRATIONS.md`, `docs/CLOUDFLARE-DEPLOYMENT.md`, `docs/PROJECT-STATUS.md`,
  `docs/PHASES.md`, `docs/AGENT-CONTEXT.md`, `docs/TOOLING.md`,
  `docs/PRODUCT-REQUIREMENTS.md`, `AGENTS.md` updated for ADR-049.
- Removed: `src/features/feedback/whatsapp.ts`, `e2e/feedback-whatsapp.spec.ts`.
- Added: `e2e/feedback-github.spec.ts` (local-preview browser checks, env-gated so it stays green
  without GitHub credentials).
- Tests: `tests/unit/p4-s4-feedback.test.ts` rewritten — schema/validation, label+title mapping,
  config states, mocked-fetch success (201), GitHub failures (401/403/404/429/500/timeout → honest
  `UNAVAILABLE`), dedupe, rate-limit, no-repo-info-in-receipt, category labels.

## Behavior guarantees

| Situation | Behavior |
| --- | --- |
| `FEEDBACK_PROVIDER` unset | `memory` provider; `local-preview` (never claims delivery) |
| `FEEDBACK_PROVIDER=github`, complete config | `ready`; submission creates a GitHub Issue |
| `FEEDBACK_PROVIDER=github`, missing repo/token | `misconfigured`; submissions fail closed with `UNAVAILABLE` |
| `FEEDBACK_PROVIDER=whatsapp`/`telegram` (retired) | `misconfigured`; no silent channel switch |
| Fixture/no mode configured | anonymous submission accepted without constructing a Supabase client |
| Rate limited | `RATE_LIMITED` (unchanged `feedback` policy) |
| Malformed input | rejected by the shared schema before the provider runs |
| GitHub HTTP 201 with issue number | `delivery: "provider"`, reference `github:<number>` |
| GitHub 401/403/404/410/429/5xx/timeout/network | `UNAVAILABLE`; note stays in form; retry with same `submissionId` |
| Existing issue with same submission marker | reused; no duplicate created |

## Verification

| Check | Result |
| --- | --- |
| `bun run test:unit` | 275 passed, 0 failed (23 files) |
| `bun run typecheck` | clean |
| `bun run build` | success |
| `bunx eslint` on this slice | clean |
| `bun run lint` (global) | blocked — remaining errors are in files other agents are editing |

## Security review summary

- `GITHUB_FEEDBACK_TOKEN` is server-side only; never logged, never returned to the client, never
  written into an Issue body.
- No email, password, card data or browser storage is collected or sent.
- Input is length-bounded (subject ≤120, message ≤2000), zod-validated, honeypot-rejects bots, and
  rate-limited by the existing `feedback` policy (fail-closed).
- Titles are sanitized (control characters collapsed, newlines removed).
- Critical findings: 0. High findings: 0.

## Not run / not authorized

- No GitHub repository created, no token provisioned, no deployment.
- Real token values are never read, printed or committed; the founder sets them in the ignored
  `.env.local` / Cloudflare Secrets.
- `e2e/feedback-github.spec.ts` runs in `memory` (local-preview) mode only; the GitHub success path
  is covered by unit tests with mocked `fetch`.
- Global `bun run lint` is not green because concurrent agents are mid-edit in unrelated route files;
  those files were not modified.
- ADR-041 Wave 5 capacity/recovery remains deferred.

## Rollback

Set `FEEDBACK_PROVIDER=memory` (or unset it) and redeploy. The form falls back to the local-preview
inbox and states plainly that nothing was delivered. No remote state exists to undo.
