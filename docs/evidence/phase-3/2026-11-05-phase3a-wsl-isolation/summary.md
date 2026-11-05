# Phase 3A Wave 0 — WSL2 Loopback Isolation Evidence

**Run ID:** `2026-11-05-phase3a-wsl-isolation`
**Date:** 5 November 2026
**Phase:** Phase 3A (Revision 3) — Wave 0 (check 6 remediation)
**Code tree under test:** `d434d9b6058fa87242186f07931d2d502bb7250c` (`main`)
**Supersedes:** the check-6 waiver recorded in `2026-11-05-phase3a-wave0-closure`.
**Result:** **Check 6 PASSES on the supported local-stack path (Linux Docker Engine inside WSL2 Ubuntu 24.04). Every enabled listener is loopback-only, and the stack is unreachable from Windows over the WSL, virtual-switch, and LAN addresses. The `stop` path leaves no containers or listeners.**

Remote/production authorization: none. No hosted Supabase project, credential, deployment, or
provider-side mutation was performed.

## 1. Why a second run

The original Wave 0 closure recorded check 6 as waived because Docker Desktop on Windows does not
honour `com.docker.network.bridge.host_binding_ipv4` for published ports, so the wrapper's isolation
gate failed closed on that runtime. The founder chose the Linux Docker Engine path (WSL2) to satisfy
the isolation contract without weakening the gate. This run proves that path end to end on the exact
committed code.

## 2. Tree and environment

- Branch: `main`
- Code commit under test: `d434d9b` (adds the transient-status readiness retry; clean tree at gate time)
- Run location: inside WSL2 distro `Ubuntu-24.04` as `root`; repository mounted at
  `/mnt/c/Users/DELL/Desktop/THE SCENCES/TheScenesApp`

| Component                                       | Version                     |
| ----------------------------------------------- | --------------------------- |
| Guest OS                                        | Ubuntu 24.04.5 LTS (x86_64) |
| WSL                                             | 3.0.3.0, kernel 6.18.54.1-1 |
| Docker Engine (Linux, apt `docker.io`)          | 29.1.3                      |
| Containerd storage driver / cgroup              | overlayfs / systemd         |
| Bun (`/root/.bun/bin/bun`, pinned `bun-v1.4.4`) | 1.4.4                       |
| Supabase CLI (Linux x64, pinned `3.0.0`)        | 3.0.0                       |
| Postgres major (config pin)                     | 17                          |

The Linux Supabase CLI tarball was fetched from the npm registry and its SHA-512 verified against
`bun.lock` before use:

```
expected: cR4S5e3nygMaBShbbt6FOiMumtrFJjwdKMXMimC1y7FpxITlwLv36BveaifQZ8aY+v1u+w8oYANU2H72Y4ibWA==
actual:   cR4S5e3nygMaBShbbt6FOiMumtrFJjwdKMXMimC1y7FpxITlwLv36BveaifQZ8aY+v1u+w8oYANU2H72Y4ibWA==
```

The wrapper was invoked with `SUPABASE_CLI_BINARY_OVERRIDE=/opt/supabase-cli/package/bin/supabase`
and `PATH=/root/.bun/bin:$PATH`. No environment mutation of the Windows host was performed; the
Docker engine, Bun, and CLI live entirely inside the WSL2 guest.

## 3. Cold start with the isolation gate

Command (inside WSL2): `bun scripts/phase3-stack.ts start`.

```
project: the-scenes-app
supabase CLI: 3.0.0 (locked: 3.0.0)
loopback network: the-scenes-phase3-loopback
api url: http://127.0.0.1:54321
publishable key present: true
listeners (4):
  - supabase_kong_the-scenes-app 127.0.0.1:54321 (loopback, docker)
  - supabase_db_the-scenes-app 127.0.0.1:54322 (loopback, docker)
  - host 127.0.0.1:54322 (loopback, host)
  - host 127.0.0.1:54321 (loopback, host)
disabled services: { ... storage/realtime/studio/mailpit/edge_runtime/analytics all false ... }
isolated: true
```

- Every published port is bound to `127.0.0.1`. The dedicated bridge network
  `the-scenes-phase3-loopback` (`com.docker.network.bridge.host_binding_ipv4=127.0.0.1`) applies on
  the Linux engine, unlike Docker Desktop on Windows.
- Disabled services are confirmed disabled in `supabase/config.toml` and absent as containers.

## 4. Stack inspection

```
captured: 2026-11-05T07:10:15-08:00
=== docker ps (project) ===
supabase_rest_the-scenes-app 3000/tcp
supabase_auth_the-scenes-app 9999/tcp
supabase_kong_the-scenes-app 8001/tcp, 8088/tcp, 8443-8444/tcp, 127.0.0.1:54321->8000/tcp
supabase_db_the-scenes-app 127.0.0.1:54322->5432/tcp
=== ss -ltn (stack ports) ===
LISTEN 0 4096 127.0.0.1:54322 0.0.0.0:*
LISTEN 0 4096 127.0.0.1:54321 0.0.0.0:*
=== db health ===
running health=healthy
```

Only Kong (API) and Postgres publish a host port, both loopback-only. `supabase_rest_*` and
`supabase_auth_*` publish nothing (`3000/tcp`, `9999/tcp` are container-internal).

## 5. Windows-side reachability (cross-boundary proof)

Captured from Windows PowerShell while the stack ran in WSL2:

```
WSL_IP=172.25.56.61
non_loopback_ipv4=172.25.48.1,192.168.100.35
LOOPBACK_54321=CONNECTED
LOOPBACK_54322=CONNECTED
REMOTE_172.25.56.61_54321=refused
REMOTE_172.25.56.61_54322=refused
REMOTE_172.25.48.1_54321=refused
REMOTE_172.25.48.1_54322=refused
REMOTE_192.168.100.35_54321=refused
REMOTE_192.168.100.35_54322=refused
=== Windows listeners on 54321/54322 ===
127.0.0.1 54322
127.0.0.1 54321
```

- Loopback reaches the API and database from Windows (expected; WSL2 localhost forwarding).
- The WSL guest address (`172.25.56.61`), the Windows virtual-switch address (`172.25.48.1`), and the
  machine LAN address (`192.168.100.35`) all refuse both ports.
- The only Windows listeners on these ports are `127.0.0.1`.

## 6. Readiness retry and stop

The first cold start exposed a transient `supabase status` race ("container is not ready: starting"
while the DB health check finished). Commit `d434d9b` adds a bounded retry (`runStatusCommand`:
up to 6 attempts, 2s apart, only for recognised readiness failures; real errors still fail at once;
`start` also retries before passing the gate). The retry is covered by four new unit tests.

`bun scripts/phase3-stack.ts status` passes, and `bun scripts/phase3-stack.ts stop`:

```
=== stop ===
phase3:stack stopped the local project (project-targeted; never --all).
STOP_EXIT=0
=== leftover project containers ===
=== leftover listeners in WSL ===
```

No leftover project containers and no leftover listeners.

## 7. Supabase image/Postgres evidence

Digests observed in the WSL2 engine match the recorded Wave 0 closure digests exactly:

| Image                                          | Digest                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `public.ecr.aws/supabase/postgres:17.11.0.011` | `sha256:7bd84e6a1d5322c7b864b9751873a0ac50f48df3f20a776e88114eadb2948fc0` |
| `public.ecr.aws/supabase/gotrue:v2.197.0`      | `sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b` |
| `public.ecr.aws/supabase/postgrest:v16.5`      | `sha256:1347d7552b88f17832912c06afbf7c43209af6eeeb60834b04aae12c9bd9d5cc` |
| `public.ecr.aws/supabase/kong:2.8.1`           | `sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d` |

## 8. Full end-of-wave gate on `d434d9b` (Windows toolchain)

| Command                         | Result                                          |
| ------------------------------- | ----------------------------------------------- |
| `bun install --frozen-lockfile` | exit 0, 436 installs / 532 packages, no changes |
| `bun run typecheck`             | exit 0 (app + `tsconfig.scripts.json`)          |
| `bun run lint`                  | exit 0                                          |
| `bun run test:unit`             | 110 passed / 0 failed, 11 files                 |
| `bun run audit`                 | exit 0, 505 packages, 1 documented exception    |
| `bun run build`                 | exit 0                                          |
| `bun run test:fixture`          | 26 passed / 4 skipped / 0 failed (2.6m)         |
| `git diff --check`              | exit 0                                          |
| `git status --short`            | clean at code commit                            |

## 9. Residual notes

- The retry masks only transient readiness failures; it does not weaken any isolation or secret check.
- Docker Desktop on Windows **still** fails the gate closed (unchanged); WSL2 Linux Docker is the
  supported local-stack path for Wave 1 and onward on this machine.
- WSL2 must be running for the local stack to be reachable from Windows; the guest engine is started
  per session and is not a Windows service.

## 10. Artifacts and secrets

Raw logs remain under ignored `.phase3-artifacts/wave-0-wsl/` (`start.log`, `stack-inspect.log`,
`windows-isolation.txt`, `stop.log`). This summary and its manifest contain no token, cookie,
password, key, or unredacted Auth trace. No historical credential was reused or tested.
