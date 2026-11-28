# GitHub Issues feedback — setup runbook

**Status:** code/local ready (P4-S4 / ADR-049). No WhatsApp Business account, API key, webhook or paid form service is needed.

## What this replaces

Feedback now creates a GitHub Issue in a private repository (`thescenes-feedback`). GitHub Issues is the founder's management interface — triage, label, assign and close Issues there. There is no feedback database, no Supabase feedback table and no separate owner dashboard.

## Prerequisites (founder action required)

1. Create a private GitHub repository named `thescenes-feedback` (for example under `thescenes-app/thescenes-feedback`). GitHub Issues must be enabled for that repository.
2. Create a fine-grained personal access token scoped to that repository with **Issues: Read and write** permission. Do not grant repository-wide or organization-wide access.
3. Add the token to the deployment's secret store, never to source control.

## Server-only variables

| Name | Kind | Required | Notes |
|---|---|---|---|
| `FEEDBACK_PROVIDER` | Variable | yes | `github` creates Issues; `memory` keeps a local preview inbox (default, reported `disabled` in hosted mode) |
| `GITHUB_FEEDBACK_REPO` | Variable | yes (when `github`) | Repository as `owner/name`, for example `thescenes-app/thescenes-feedback` |
| `GITHUB_FEEDBACK_TOKEN` | Secret | yes (when `github`) | Fine-grained token scoped to the feedback repository with Issues read/write |
| `GITHUB_FEEDBACK_API_BASE` | Variable | no | Optional; defaults to `https://api.github.com` |

On Cloudflare Workers, set these in the dashboard under **Workers → Settings → Variables and Secrets**. Locally they come from the ignored `.env.local` file.

## Behavior

- A complete GitHub configuration reports the feedback channel `ready`.
- An incomplete one reports `misconfigured`, and submissions fail closed with the safe `UNAVAILABLE` contract — it never silently falls back to the memory preview.
- Success is claimed only after GitHub confirms an Issue number (HTTP 201).
- Each Issue carries the category, subject, description, platform area, current route, coarse role (member/guest), pseudonymous user reference and timestamp — and nothing else. No email, password or card data.
- Categories map to GitHub labels and title prefixes, for example `[BUG] Course enrollment problem`.
- A duplicate-safe retry reuses an existing Issue identified by a hidden submission marker in its body, so a retry after a lost response does not create a second Issue.

## How to test (founder-controlled)

1. Set `FEEDBACK_PROVIDER=github`, `GITHUB_FEEDBACK_REPO` and `GITHUB_FEEDBACK_TOKEN` for your deployment.
2. Open `/help#feedback`, fill in the form and submit.
3. Confirm the success message appears.
4. Confirm a new Issue appears in the private repository with the correct label and title prefix.
5. Submit again with the same note — the server should report success but not create a second Issue (duplicate-safe retry).
6. Remove or invalidate the token and confirm submissions return an honest failure message instead of a fake success.

Never paste real token values into chat, issues, documents or source control.
