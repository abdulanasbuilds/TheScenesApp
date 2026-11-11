# The Scenes — Account Email and Password Recovery Setup

**Status:** P4-S1 implemented as code/local work under ADR-042; hosted account-email configuration on
THE SCENES is approved under ADR-043 (11 November 2026) and pending the founder dashboard/Resend steps.
No deployment or real customer data is authorized.
**Parent documents:** `docs/PHASE-4-PLAN.md` (§P4-S1, §11, §12), `docs/INTEGRATIONS.md` (Resend),
`docs/DECISIONS.md` (ADR-042).

This document explains how account **email confirmation** and **password recovery** work in The Scenes,
what a human must configure, how to verify it, and how to roll it back. It names configuration values
only. No SMTP password, API key or template secret is ever read, printed **or** committed.

## What this feature does

- **Email confirmation** is handled by Supabase Auth's built-in confirmation flow. The application
  requests it at sign-up; Supabase Auth creates and verifies the confirmation token.
- **Password recovery** lets a signed-out person set a new password:
  1. `/forgot-password` submits an email address to `resetPasswordForEmail`;
  2. Supabase Auth emails a single-use link to `/reset-password?code=...`;
  3. `/reset-password` strips the code from the visible URL, exchanges the PKCE code
     (`exchangeCodeForSession`) and shows a new-password form;
  4. `updateUser({ password })` sets the new password, then `signOut({ scope: "global" })` revokes
     every session.

Supabase Auth is the **only** token authority. The application never builds its own tokens or links,
never uses a service-role/admin key for ordinary recovery, and never contacts an email provider
directly.

## Data modes

| Mode | Behaviour |
|---|---|
| `fixtures` | No provider contact. Recovery returns an honest `delivery: "not-configured"` acknowledgement. `/reset-password` refuses and states recovery is not connected. |
| `supabase-local` | Connects to the local Supabase stack (`http://127.0.0.1:54321`). Emails are captured by the local mail catcher. |
| `supabase-staging` | Connects to the approved pre-production Supabase project. Real email delivery requires Supabase Auth custom SMTP (see below). |

A configured integration never silently falls back to fixtures.

## Hosted pre-production (THE SCENES) — current status

Approved by ADR-043 on 11 November 2026, **only** for the pre-production project
`okdzuqgzgnmmbtjxdaci`.

- **App environment:** the git-ignored `.env.staging.local` sets `VITE_DATA_MODE=supabase-staging` and
  `VITE_SUPABASE_URL=https://okdzuqgzgnmmbtjxdaci.supabase.co` with an `sb_publishable_...` key, and it
  validates against `src/lib/env.ts`. No secret is committed.
- **Redirect URLs to allow in Supabase:** the app currently runs at `http://127.0.0.1:5000`, so it sends
  `http://127.0.0.1:5000/auth/confirm` and `http://127.0.0.1:5000/reset-password` as `redirectTo`. If an
  HTTPS app host is later approved, add its `/auth/confirm` and `/reset-password` URLs instead.
- **SMTP:** configure Resend custom SMTP and a verified sending domain (names above).
- **Pending:** the Supabase Auth dashboard settings, the Resend account/domain/key, and one
  founder-controlled inbox test. No database migration is needed for P4-S1.

> Operational note: the Supabase MCP configured in this environment currently resolves to VOICE SYSTEM
> (`extdmvwwvgqstoayzhhy`) through a global OpenCode config, not THE SCENES. Do not run its tools for this
> work until the `project_ref` is corrected and a read-only check confirms the target.

## Configuration names (values are never printed)

Application environment (ignored local file, existing names):

- `VITE_DATA_MODE` — `fixtures`, `supabase-local` or `supabase-staging`;
- `VITE_SUPABASE_URL` — approved project URL;
- `VITE_SUPABASE_PUBLISHABLE_KEY` — public/publishable key only.

Supabase Auth custom SMTP (Supabase Dashboard → Authentication → Emails → SMTP Settings; owned by
Supabase Auth, not readable by the application):

- **Host** — `smtp.resend.com`;
- **Port** — `465` (implicit TLS) or `587`;
- **Username** — `resend`;
- **Password** — a scoped Resend API key (secret; place it in the dashboard/secret store only);
- **Sender name / sender email** — the verified business domain address;
- **Verified Resend sending domain** — required for delivery.

Redirect allowlist (Supabase Dashboard → Authentication → URL Configuration → Redirect URLs). Only
these app paths are used:

- Local: `http://127.0.0.1:5000/auth/confirm`, `http://127.0.0.1:5000/reset-password`
- Hosted: `https://<approved-host>/auth/confirm`, `https://<approved-host>/reset-password`

The application also checks the origin itself (`src/features/auth/redirects.ts`): loopback is pinned to
`127.0.0.1:5000`; every hosted origin must be HTTPS; an unapproved origin fails closed. Supabase's
redirect allowlist is the second, authoritative layer.

## Email templates

Supabase Auth sends both emails. Keep the templates short, plain and accessible:

- **Confirmation template** — subject such as "Confirm your The Scenes account"; one clear action link;
  a short line explaining that no action is needed if the request was not expected.
- **Recovery template** — subject such as "Reset your The Scenes password"; one clear action link; a
  line stating the link is single-use and expires quickly, and that the password is unchanged if the
  request was not expected.

Template rules:

- include a meaningful link label (for example "Confirm email" / "Reset password") rather than a bare
  URL;
- keep sufficient colour contrast and readable text size; do not rely on colour alone;
- include the plain URL as fallback text for clients that block buttons;
- never include the recovery code in the visible body text preview, and never request a password in the
  email;
- do not add tracking pixels or third-party images.

## Verify the setup

1. **Application check (no secret):** open `/forgot-password` → "Operator: check account-email setup"
   → "Run setup check". It reports provider/vendor, mode, redirect paths and each item as
   `configured-in-app`, `manual-verification-required` or `not-configured`. It never returns a value.
   The same data is available through the `getAuthEmailSetupStatus` server function.
2. **Local:** switch `VITE_DATA_MODE=supabase-local`, request recovery, and read the link from the local
   mail catcher.
3. **Connected (requires separate remote approval):** after Resend account, verified domain, scoped key
   and Supabase Auth SMTP are approved and configured, request one recovery for a founder-controlled
   fictional address and confirm the email arrives and the link returns to `/reset-password`.

## Rollback

- Disable custom SMTP in Supabase Auth to stop real delivery; the default disabled/no-send path remains.
- Keep the code in place: in `fixtures` mode the feature is honest and inactive; no fixture fallback
  occurs after a configured integration fails.
- `/reset-password` and `/forgot-password` remain safe to visit without a provider.

## Security notes

- Known and unknown accounts receive the identical acknowledgement; a provider 4xx (other than 429) is
  treated as acknowledged to prevent account enumeration. `429` maps to a safe rate limit; `status 0`
  or `5xx` maps to a safe "temporarily unavailable" message.
- Recovery parameters (`code`, `error`, `error_code`, `token`, `token_hash`) are removed from the
  visible URL before any network call.
- Provider responses are reduced to `status`/`code` only; email addresses, tokens, recovery codes and
  provider bodies are never logged or stored in evidence.
- Request rate limiting uses the existing local limiter in code/local mode; provider-backed limits are
  a later (P4-S2) slice.

## Authorization boundary

ADR-043 authorizes the Supabase Auth URL/SMTP configuration and the hosted `.env.staging.local` target on
THE SCENES `okdzuqgzgnmmbtjxdaci` only. It does **not** authorize:

- the Resend account, domain verification or scoped key — these remain founder actions (never paste the
  key into chat, issues or source control);
- deployment, a production environment, real customer data or payments;
- VOICE SYSTEM (`extdmvwwvgqstoayzhhy`) or any other Supabase project;
- any other Phase 4 slice.

The agent records configuration names and state, never values. Connected recovery is verified by one
founder-controlled inbox test after the dashboard settings exist.
