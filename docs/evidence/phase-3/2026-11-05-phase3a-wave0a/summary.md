# Phase 3A Wave 0A — Local Isolation Evidence

**Run ID:** `2026-11-05-phase3a-wave0a`
**Date:** 5 November 2026
**Phase:** Phase 3A (Revision 3) — Wave 0A
**Scope:** (A) dependency audit remediation; (B) credential-safe local Supabase stack tooling + loopback isolation proof.
**Result:** **Part A complete. Part B tooling complete and unit-verified. Live loopback isolation proof BLOCKED by the container runtime — gate failed closed and the stack was stopped.**

Remote/production authorization: none. No hosted Supabase project, credential, deployment, or
provider-side mutation was performed.

## 1. Tree under test

- Branch: `main`
- HEAD: `ed890b5169b0453518d7e7c3e77115f8591608ae`
- Working tree: intentionally uncommitted (pre-existing Wave 0 work preserved; no reset/revert run).

## 2. Environment

| Component | Version |
| --- | --- |
| OS | Windows (win32) |
| Bun | 1.4.4 |
| Node | 26.12.1 |
| Supabase CLI (pinned, `@supabase/cli-windows-x64`) | 3.0.0 |
| Docker Engine (Docker Desktop) | 29.9.2 |

## 3. Part A — dependency audit remediation

| Stage | Critical | High | Moderate | Low | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Before | 3 | — | — | — | 30 |
| After `bun audit fix` (in-range) | 0 | 0 | 1 | 0 | 1 |

- Remediated cohort (all older than Bun's 24h `minimumReleaseAge`): TanStack `react-start 1.168.60`,
  `react-router 1.170.41`, `router-plugin 1.168.42`; `vite 8.1.6`; `zod 4.6.6`.
- Remaining advisory: `minimatch@10.2.5` — **dev-only**, transitive via `eslint → @eslint/config-array`
  and `typescript-eslint → @typescript-eslint/typescript-estree`. No in-range fix exists (both
  dependents require `^10.x`; the patched release is `>=11.0.1`). **Not reachable at runtime.**
  Advisory: https://github.com/advisories/GHSA-g3hv-75wg-m249
- No `bun audit fix --latest`, no broad `overrides`, no release-age bypass.

Post-upgrade verification (all exit 0): `bun install --frozen-lockfile`, `bun run typecheck`,
`bun run lint`, `bun run build`, `bun run test:e2e` (26 passed / 4 skipped / 0 failed),
`git diff --check`.

## 4. Part B — stack tooling

Implemented `scripts/phase3-stack.ts` + `scripts/phase3-stack/*` with unit tests:

- `SUPABASE_TELEMETRY_DISABLED=1` on every child; hosted credential/target env variables stripped.
- Pinned `supabase@3.0.0` resolved from `@supabase/cli-<platform>`.
- CLI stdout/stderr captured in memory, parsed, and only ever printed redacted.
- Hosted commands (`link`, `login`, `projects`, `secrets`, `deploy`, `push`, `pull`, …), hosted
  project refs, and `stop --all` are refused before spawn.
- `stop` is project-targeted only: `stop --workdir <root> --project-id the-scenes-app`.
- Failure cleanup in `finally`-style guards; the stack is stopped if isolation cannot be proven.
- Disabled-service verification: Realtime, Studio, Mailpit (`local_smtp`), Storage, Edge Functions,
  Analytics confirmed `false` in `supabase/config.toml` and absent as containers.
- Loopback remediation implemented per official Supabase/Docker guidance: a dedicated bridge
  network `the-scenes-phase3-loopback` created with
  `-o com.docker.network.bridge.host_binding_ipv4=127.0.0.1`, then `supabase start --network-id the-scenes-phase3-loopback`.

Unit tests: **79 passing / 0 failing** across 10 files (`bun run test:unit`). Typecheck (app +
`tsconfig.scripts.json`) and lint pass.

## 5. Live isolation attempt — observed listeners (redacted)

The gate enumerated Docker-published ports and host sockets. Every stack port was bound on **all
interfaces**, not loopback:

| Source | Service | Address | Classification |
| --- | --- | --- | --- |
| docker | `supabase_kong_the-scenes-app` | `0.0.0.0:54321` | unspecified (offender) |
| docker | `supabase_kong_the-scenes-app` | `:::54321` | unspecified (offender) |
| docker | `supabase_db_the-scenes-app` | `0.0.0.0:54322` | unspecified (offender) |
| docker | `supabase_db_the-scenes-app` | `:::54322` | unspecified (offender) |
| host | — | `0.0.0.0:54321`, `0.0.0.0:54322` | unspecified (offender) |
| host | — | `:::54321`, `:::54322` | unspecified (offender) |
| host | — | `::1:54321`, `::1:54322` | loopback |

Because the gate saw unspecified (all-interface) binds, it **failed closed**: it reported the
offenders and stopped the local project (project-targeted). No containers or listeners were left
running. No firewall or host-network mutation was attempted.

## 6. Root cause

The Supabase CLI attached its containers to the loopback network correctly
(`docker inspect` shows `the-scenes-phase3-loopback`) and published ports with an empty host IP
(`HostConfig.PortBindings = {"8000/tcp":[{"HostIp":"","HostPort":"54321"}]}`), expecting the network
driver default to apply. The network option was set
(`docker network inspect … Options = {"com.docker.network.bridge.host_binding_ipv4":"127.0.0.1"}`),
yet ports still bound `0.0.0.0`/`[::]`.

A control probe isolated the cause to the runtime: a plain container started on the same network
with `-p 54399:5432` (no host IP) also bound `0.0.0.0:54399` and `[::]:54399`. Therefore **Docker
Desktop (Windows) does not honour `com.docker.network.bridge.host_binding_ipv4` for published
ports** — the host-side port forwarder binds all interfaces regardless. This is a container-runtime
limitation, not a Supabase CLI or wrapper defect.

## 7. Gate outcome

`bun scripts/phase3-stack.ts start` exited `1` with `isolated: false`, listed the offending
listeners, stopped the stack, and left the machine clean. The isolation requirement is **not
satisfied** in this environment.

## 8. Safe remediation options (decision required)

No host mutation was performed. Options, in rough order of preference:

1. **Run the stack under a Linux Docker Engine that honours the bridge option** (e.g. Docker Engine
   inside the WSL2 distro, or a Linux host/CI runner), keeping the wrapper unchanged. Loopback
   binding then applies, and the host reaches it via `127.0.0.1`. Requires an environment decision.
2. **Approve a scoped host-level inbound block** for the two ports (Windows Firewall rule) as
   defence-in-depth — but note this does not make the bind loopback, so it does not satisfy the
   literal gate; it would require a documented gate amendment.
3. **Defer the live isolation proof** to a credentialed-free Linux environment and keep the gate
   fail-closed on this machine.

## 9. Artifacts (raw, gitignored)

- `.phase3-artifacts/wave-0a/audit-before.txt`
- `.phase3-artifacts/wave-0a/audit-after.txt`
- `.phase3-artifacts/wave-0a/stack-start.log` (first attempt)
- `.phase3-artifacts/wave-0a/stack-start-loopback.log` (loopback-network attempt)
- `.phase3-artifacts/wave-0a/diag-ps.txt`, `diag-kong-portbindings.txt`, `diag-kong-networks.txt`,
  `diag-network-options.txt` (redacted/structural only)

No dump, token, cookie, password, or secret value is included in this committed summary.
