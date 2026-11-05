# The Scenes — Phase 3 Revision 3 Review Record

**Status:** FOUNDER-APPROVED LOCAL DIRECTION; FRAMEWORK CORRECTIONS APPLIED 5 NOVEMBER 2026, VERIFIED AGAINST INSTALLED SOURCE
**Date:** 5 November 2026
**Scope:** revision 2 plans, current source/tests/configuration, current official provider/framework guidance

## 1. Review method

Five independent read-only agents reviewed the current working tree in parallel:

1. PostgreSQL schema, constraints, RLS, grants, commands, migrations, seed, and recovery;
2. authentication, sessions, CSRF, cookies/cache, secrets, errors, and authorization;
3. exact TanStack Start/Supabase integration and affected-file feasibility;
4. testing, CI, load, evidence, recovery, and operations;
5. adversarial whole-plan/product/domain consistency.

All five returned a no-go for implementing revision 2 literally. No reviewer changed files, installed a
package, started Docker/Supabase, accessed a secret, or mutated a remote resource.

## 2. Consolidated revision-2 defects and revision-3 disposition

| Area | Confirmed revision-2 gap | Revision-3 resolution |
|---|---|---|
| identity | registration lacked required handle; onboarding/settings contradicted immutability | one shared schema; handle collected at signup and read-only afterward |
| creator intent | UI choice could be mistaken for role/capability | intent only; no authority or workspace grant |
| viewer state | shells/home could show fixture identity in local mode | root server-derived viewer and complete fixture/local adapters |
| access model | public outline, lesson body, resources, private metadata, and enrolment rules conflicted | explicit listed/privacy/outline/preview/content/resource matrix |
| curriculum schema | required display fields/API missing; lesson URL used fixture ID semantics | complete columns, lesson slug, separate content, `getLessonDetail` |
| tenant integrity | course could reference another workspace's community; lesson course trigger could drift | composite FKs, no sync trigger |
| DDL lifecycle | fields, nullability, deletes, state transitions, and completion semantics were incomplete | full DDL appendix and state tables; derived course progress |
| seed | platform/course ownership required profiles while seed forbade Auth actors | fixed fictional non-login catalogue Auth actors; browser users still real signup |
| Auth trigger | invoker-default wording would make profile bootstrap fail | private hardened definer trigger and direct tests |
| idempotency/audit | unique domain rows did not prevent duplicate audit events | audit only transition winner; no-op retries do not audit |
| data mode | removing store actions would break fixture mode and leave hidden consumers | stable contracts with complete fixture and local implementations |
| local isolation | Vite used `0.0.0.0`/arbitrary hosts; provider listeners unverified | loopback bind, host protection, Docker/listener/second-device gate |
| secret env | server-only parsing did not stop a privileged key entering a `VITE_` bundle | Vite-time + request-time validation; publishable prefix only; bundle scan |
| sessions | logout scope/cookie chunks/attributes/Remember control incomplete | explicit local sign-out, all-cookie propagation, reviewed local cookie policy |
| errors | unexpected TanStack/provider errors could escape safe envelopes | mandatory outer safe-error middleware/factory and status map |
| import safety | custom client file rule replaced `*.server.*` default; marker was wrong | protect both patterns, official marker, negative build/bundle test |
| API/route inventory | home, shells, classroom, public detail, generated tree, configs omitted | complete affected-file list and loader invalidation |
| tests | fixture assumptions conflicted with real Auth/private access | separate fixture and local suites plus protocol/integration harness |
| CI | docs claimed browser/backend gates not present in workflow | two explicit CI jobs and exact gate responsibilities |
| load | no data generator or executable transformed-server-function workload | deterministic generator + Playwright-context UI/application workload |
| recovery | dump/restore/auth trigger/portability semantics incomplete | data-only restore into a second isolated local Supabase stack; separate honest portability export/mapping |
| evidence | raw artifacts risked secrets in committed docs/CI | ignored raw directory + redacted committed summary/manifest only |

## 3. Files constituting revision 3

- `PHASE-3-REVISION-3-SPEC.md`;
- `PHASE-3-DATA-AUTHORIZATION-CONTRACT.md`;
- `PHASE-3-IMPLEMENTATION-PLAN-R3.md`;
- `PHASE-3-VERIFICATION-RUNBOOK.md`;
- this review record.

Revision 2 remains historical evidence. It is not implementation authority after revision 3 approval.

## 4. Re-review gate

The same independent review tracks should verify revision 3 against the current tree. Any remaining
Critical/High implementation ambiguity returns the affected document to Draft. Promotion requires:

- database/RLS verdict: implementation-safe;
- auth/security verdict: implementation-safe for loopback local proof;
- framework integration verdict: exact API/file plan feasible;
- testing/operations verdict: executable gates and recovery;
- whole-plan verdict: no material product behavior left for implementers to invent.

Only after those verdicts are reconciled may the record change to `REVIEWED`. Founder approval is now
recorded; clean-install and local-isolation Wave 0 gates still apply. Legacy hosted cleanup is a
separate incident/production blocker, and old accounts/credentials remain forbidden.

## 5. Founder decisions after first re-review

On 5 November 2026 the founder:

- approved all six revision-3 product rules;
- authorized isolated, credential-free local implementation and testing;
- permanently retired every old provider account/project/credential from new work;
- required new business-controlled accounts and fresh credentials only when a later approved phase
  needs hosted/staging/production integration;
- required local verification before production consideration.

The first re-review's remaining High findings were corrected: listed-only self-join/rejoin, membership-
loss content locking, community-scoped Phase 3A courses, exact DTO/page-mode contracts, client-reachable
Start middleware wrappers, compiler-recognized server functions plus safe handler/POST rules,
second-stack data-only recovery, explicit load-server lifecycle/rate units, and canonical-document
alignment. The final re-review is limited to Critical/High implementation ambiguity; non-blocking Wave 0
refinements do not reopen product scope.

## 6. Final framework corrections (5 November 2026)

The last framework re-check returned two confirmed High findings against the installed package source.
Both are now corrected in the canonical documents:

1. **Server-function factory was not compiler-recognized.** `node_modules/@tanstack/start-plugin-core/
   src/start-compiler/config.ts` registers only the direct root export `createServerFn` (plus
   `createIsomorphicFn`, `createServerOnlyFn`, `createClientOnlyFn`). A `createSafeServerFn(...).handler
   (...)` chain would not be transformed. The plan now requires the direct chain with
   `.validator(nonThrowingTypedPassthrough).handler(withSafeHandler(schema, handler))`, and the shared
   module is renamed from `create-safe-server-fn.ts` to `src/features/shared/safe-handler.ts`.
2. **The load driver was pathless.** `node_modules/@tanstack/router-generator/src/utils.ts` treats an
   unescaped leading `_` as pathless and omits a childless pathless node from the generated tree, so
   `src/routes/__phase3-load.tsx` would have no URL. The driver is now
   `src/routes/phase3-load.tsx`, guarded by `PHASE3_LOAD_DRIVER=1` and loopback, with a router-tree test
   asserting `/phase3-load` exists.

Both are implementation-shape corrections with no product or scope change. Wave 0 must add the two
asserting tests before any Wave 1 migration.
