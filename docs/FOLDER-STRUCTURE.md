# The Scenes — Canonical Folder Structure

**Updated:** 5 November 2026
**Status:** accepted Phase 2 layout plus proposed Phase 3A revision-3 additions; re-review pending

The Scenes is a single-package repository with internal module boundaries. This document describes
the tree that exists now and the proposed Phase 3A additions. No addition is implementation-authorized
until revision 3 passes re-review, founder approval and Gate A. If an older example conflicts with
`PHASE-3-IMPLEMENTATION-PLAN-R3.md`, revision 3 controls.

## Root

```text
TheScenesApp/
├── .agent-os/                 project scope boundary
├── .github/workflows/         CI configuration
├── docs/                      durable product/architecture/security evidence
├── e2e/                       Playwright browser tests
├── scripts/                   bounded local verification/load scripts (Phase 3+)
├── src/                       application code
├── supabase/                  local config, migrations, tests and seed (Phase 3+)
├── tests/integration/         real local-stack application/security tests (Phase 3A)
├── .phase3-artifacts/         ignored raw local evidence; never committed
├── .env.example               non-secret local variable names/placeholders
├── AGENTS.md                  canonical agent contract
├── package.json               single package and scripts
├── bun.lock                   sole dependency lockfile
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

Generated/local directories such as `node_modules/`, `.output/`, `.tanstack/`, `.wrangler/`,
`.playwright/`, local dumps and `.env.local` remain ignored.

Bun `1.4.4` remains the sole package manager. Node is the deliberate execution runtime for the pinned
Vite, TypeScript and Playwright CLIs; CI pins Node `26.12.1`, and `package.json` requires `>=22.12.0`.

## Current `src/` tree

```text
src/
├── components/
│   ├── domain/                reusable product cards/compositions
│   ├── layout/                public/member/community/creator/auth shells
│   └── ui/                    shared primitives
├── data/
│   ├── seed.ts                deterministic Phase 2 fixtures
│   └── types.ts               current fixture/domain shapes
├── lib/                       small client-safe utilities/hooks
├── routes/                    TanStack Start file routes (canonical route root)
├── store/
│   └── app-store.tsx          explicit fixture adapter/UI state; never local-mode authority
├── router.tsx
├── routeTree.gen.ts           generated; do not edit manually
├── server.ts                  TanStack Start handler entry
└── styles.css                 canonical global stylesheet
```

There is no `src/app/routes`, `src/styles/globals.css`, separate `client.tsx`, or second route tree.
The accepted implementation—not historical examples—decides these paths.

## Routes

`src/routes/` uses TanStack Start file routing:

```text
src/routes/
├── __root.tsx
├── index.tsx                  marketing landing page
├── explore.tsx
├── login.tsx
├── register.tsx
├── onboarding.tsx
├── home.tsx
├── my-learning.tsx
├── settings.tsx
├── communities/$communityId.tsx
├── c/$communityId/...         community/classroom/member/event/post routes
├── dashboard/...              creator workspace routes
├── creators/$handle.tsx
└── marketplace/...            fixture-only until its approved phase
```

Rules:

- `/` is the public marketing page; `/home` is the member experience.
- Route components may import client-safe schemas, DTOs and `*.functions.ts` server-function wrappers.
- Route guards improve UX; private server functions still authenticate and authorize independently.
- Dynamic IDs/slugs are untrusted selectors and receive runtime validation.

## Phase 3 contract/function modules

Route-importable contracts and server-function wrappers live outside the protected server directory:

```text
src/features/
├── shared/
│   └── safe-handler.ts
├── auth/
│   ├── auth.schemas.ts
│   ├── auth.contracts.ts
│   ├── auth.functions.ts
│   ├── profile.schemas.ts
│   ├── profile.contracts.ts
│   └── profile.functions.ts
├── community/
│   ├── community.schemas.ts
│   ├── community.contracts.ts
│   └── community.functions.ts
└── learning/
    ├── course.schemas.ts
    ├── course.contracts.ts
    ├── course.functions.ts
    ├── learning.schemas.ts
    ├── learning.contracts.ts
    └── learning.functions.ts
```

- `*.schemas.ts` contains client-safe Zod schemas and serializable DTOs only.
- `*.functions.ts` contains `createServerFn` wrappers. Static imports are safe because TanStack Start
  replaces their implementations with client RPC stubs.
- Feature modules do not import React components.
- Provider/database types never escape as public route contracts.

## Phase 3 middleware wrappers and server-only modules

```text
src/middleware/
├── auth.ts                     client-reachable wrapper; server callback only
├── request-id.ts               client-reachable wrapper; server callback only
└── safe-errors.ts              client-reachable defense-in-depth wrapper

src/server/
├── db/
│   └── database.types.ts       generated from local migrations; committed
├── http/
│   ├── errors.server.ts
│   ├── logger.server.ts
│   └── request-context.server.ts
├── repositories/
│   ├── profiles.server.ts
│   ├── communities.server.ts
│   ├── courses.server.ts
│   └── learning.server.ts
├── services/
│   ├── profile-service.server.ts
│   ├── community-service.server.ts
│   ├── course-service.server.ts
│   └── learning-service.server.ts
├── supabase/
│   ├── auth.server.ts
│   └── server-client.server.ts
└── env.server.ts
```

`src/start.ts` is client-loaded by TanStack and may import only the client-reachable middleware wrappers.
Those wrappers contain no protected top-level import; sensitive logic stays inside compiler-recognized
server callbacks/helpers. `src/start.ts` explicitly installs CSRF, request ID and defense-in-depth error
handling. `src/server.ts` remains the handler entry and is not a middleware registry.

Server rules:

- `src/server/**` is protected by Vite/TanStack import protection.
- UI/routes never import repositories, services, environment code or provider clients directly.
- Repositories are the only modules that issue Supabase table/RPC queries.
- Services enforce use-case authorization and map provider rows/errors into internal DTOs.
- Every request gets a request-scoped Supabase client; there is no shared mutable user client.
- No application service/secret-role client exists in the Phase 3 proof.

## Supabase local proof

```text
supabase/
├── config.toml
├── migrations/
│   └── <timestamp>_<purpose>.sql
├── tests/
│   └── database/
│       └── *_test.sql
└── seed.sql
```

- SQL migrations are the sole schema history.
- Every exposed table migration includes constraints, indexes, RLS and grants together.
- Tests cover grants, constraints, RLS and direct database-command calls.
- `seed.sql` contains fictional platform catalogue data plus the minimum fixed, non-login-capable Auth
  catalogue actors required by referential integrity. Browser learner users always use real signup.
- Migrations are forward-only after application; destructive changes require expand/migrate/contract
  and separate approval.

## Components, data and state

- `components/ui/`: primitives and reusable accessibility behavior.
- `components/layout/`: application/public/workspace shells.
- `components/domain/`: reusable domain presentation; no provider SDK calls.
- `data/`: deterministic fixture records and their current types. Fixtures remain for explicitly
  unresolved Phase 2 surfaces.
- `store/app-store.tsx`: may retain durable preview mutations only behind the explicit fixture adapter.
  In `supabase-local`, auth, membership, enrolment and progress always come from server contracts and
  fixture values are never authority or fallback.

There is no silent backend-to-fixture fallback. `VITE_DATA_MODE=fixtures|supabase-local` chooses the
mode explicitly; backend failures render error/retry states.

## Tests and scripts

```text
e2e/
├── helpers.ts
├── auth-flow.spec.ts            Phase 3
├── learning-flow.spec.ts        Phase 3
├── security-contract.spec.ts    Phase 3
├── auth-route-contract.spec.ts  Phase 3
├── critical-flows.spec.ts
├── route-contract.spec.ts
└── visual-contract.spec.ts

tests/integration/
├── auth.integration.test.ts
├── authorization.integration.test.ts
├── cache-session.integration.test.ts
└── commands-concurrency.integration.test.ts

scripts/
├── check-client-boundary.ts
├── phase3-generate-data.ts
├── phase3-query-plans.ts
├── phase3-load.ts
└── phase3-recover.ts

src/routes/
├── phase3-load.tsx        local-only load driver (no leading underscore)
└── ...
```

`*.functions.ts` files import `createServerFn` directly from `@tanstack/react-start` and wrap only the
handler with `withSafeHandler`. A project factory that wraps or re-exports `createServerFn` is not
compiler-recognized and is rejected by the boundary/build test. Files beginning with `_` are pathless in
the router generator and must not be used for the load driver, which needs a real `/phase3-load` URL.

- Co-located `*.test.ts` files use Bun for pure schemas/codecs/error mapping.
- Database tests use pgTAP through `bun run db:test`.
- E2E tests create users through the real local signup flow; they never use a service key.
- Raw dumps, credentials and test-user artifacts are not committed.

## Import boundaries

Allowed direction:

```text
routes/components
    ↓
client-safe schemas + *.functions.ts RPC wrappers
    ↓
server services
    ↓
repositories
    ↓
request-scoped Supabase adapter
```

Forbidden:

- client/route/component → `src/server/**`;
- component → repository/provider SDK;
- repository → React/UI;
- service → route/component;
- public DTO → Supabase/provider-specific type;
- one feature mutating another feature's private state directly;
- importing secrets or server environment modules into shared/client code.

## Naming

- Route and utility files: kebab-case unless a framework convention requires another shape.
- React component exports: PascalCase.
- Server-function wrappers: `*.functions.ts`.
- Shared input/DTO contracts: `*.schemas.ts`.
- Pure unit tests: `*.test.ts`; browser tests: `*.spec.ts`; database tests: `*_test.sql`.
- Migration names: CLI-generated timestamp plus descriptive snake_case purpose.

## Phase boundaries

- **Phase 2 accepted:** deterministic frontend fixtures under `src/data`/`src/store`.
- **Phase 3 local proof:** only auth/profile/community membership/course enrolment/lesson progress.
- **Phase 4+:** email, approved platform files, push and distributed rate limiting.
- **Later phases:** creator operations, referrals, payments, marketplace, AI and production scale.

The presence of a route or fixture does not authorize its backend implementation.

## Update rule

When a real architectural boundary changes, update this document and the applicable phase plan in the
same change. Do not keep a second aspirational tree that contradicts the working repository.
