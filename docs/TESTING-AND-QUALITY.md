# The Scenes � Testing and Quality Strategy

## Purpose

This document defines the testing, verification, and quality assurance approach for The Scenes.

## Testing pyramid

```
          /\
         /  \     E2E Tests (Critical flows)
        /----\
       /      \   Integration Tests (Phase 3+)
      /--------\
     /          \ Unit Tests (Domain logic, utilities)
    /------------\
```

## Current testing posture (Phase 0�2)

### Phase 0 (Documentation)

- Documentation integrity checks in CI
- Markdown link validation
- Contract integrity (AGENTS.md presence, no duplicate agent files)

### Phase 1 (Design)

- Design review gates
- Multiple-variant comparison
- Accessibility baseline review

### Phase 2 (Frontend with Fixtures)

- **E2E tests** for critical user flows
- Component visual testing where practical
- Responsive/mobile checks
- Accessibility checks (keyboard, focus, contrast, semantic HTML)
- Loading/error/empty state coverage

## E2E testing (Playwright)

### Baseline setup

Already configured:

- **Framework:** Playwright (`@playwright/test`)
- **Config:** `playwright.config.ts`
- **Test directory:** `e2e/`
- **Artifacts:** `.playwright/` (gitignored)
- **Projects:** `desktop` (1440×900), `tablet` (768×1024), `mobile` (Pixel 7 at 390×844)
- **Local workers:** 3 (bounded after four workers produced dev-server/UI timing flakes)

### Commands

```bash
bun run test:e2e          # Run all E2E tests
bun run test:fixture      # Accepted Phase 2 fixture suite (explicit alias)
bun run test:e2e:ui       # Interactive mode
bun run test:e2e:report   # View last test report
```

### Unit and local-stack commands (Phase 3A Wave 0)

```bash
bun run test:unit          # Bun unit tests for scripts/ and tests/unit/ (no stack or Docker)
bun run typecheck          # App config + tsconfig.scripts.json
bun run audit              # Dependency audit with the documented dev-only advisory exception
bun run phase3:stack:start # Start the local Supabase stack (loopback gate enforced)
bun run phase3:stack:status
bun run phase3:stack:stop
```

`bun run test:unit` must not require a running Supabase stack or Docker. The `phase3:stack:*`
commands are credential-safe wrappers over the pinned `supabase@3.0.0` CLI; see
`docs/evidence/phase-3/2026-11-05-phase3a-wave0a/summary.md` for the runtime isolation finding and
`docs/evidence/phase-3/2026-11-05-phase3a-wave0-closure/summary.md` for the waiver and current status.

`bun run audit` ignores exactly one documented dev-only advisory,
`GHSA-g3hv-75wg-m249` (`minimatch@10.2.5`, unreachable at runtime). Any other advisory fails the
command. Re-check and remove the exception when `@eslint/config-array` / `typescript-eslint` move to
`minimatch >= 11.0.1`.

### Test organization

```text
e2e/
+-- critical-flows.spec.ts       accepted fixture flows
+-- route-contract.spec.ts       fixture route/link graph
+-- visual-contract.spec.ts      responsive/runtime sweep
+-- auth-flow.spec.ts            Phase 3A local Auth/profile
+-- learning-flow.spec.ts        Phase 3A persisted learner journey
+-- security-contract.spec.ts    CSRF/cookie/cache/direct-call checks
+-- auth-route-contract.spec.ts  local private-route behavior
+-- helpers.ts                   mode-aware hydration/auth helpers

tests/unit/
+-- env.test.ts                  local-only mode/URL/key contract (no network)

tests/integration/
+-- auth.integration.test.ts
+-- authorization.integration.test.ts
+-- cache-session.integration.test.ts
+-- commands-concurrency.integration.test.ts
```

### What to test

**Critical user journeys:**

- Landing ? Explore ? Course detail ? Join (fixture)
- Landing ? Community ? View posts
- Workspace ? Create course (fixture save)
- Workspace ? View analytics
- Mobile navigation flows
- Error states (404, network error, empty states)

**NOT every component:**

- Don't test every button color
- Don't test Radix/shadcn primitive behavior (already tested upstream)
- Don't duplicate unit test coverage in E2E

### Mobile-first rule

Every critical flow must pass on the `mobile` project (Pixel 7 viewport). Phase 3A browser coverage is
Chromium-only; cross-engine testing is deferred and must not be claimed.

Desktop-only failures are acceptable for admin/creator tools in Phase 2 if mobile support is documented as Phase 3 work.

### CI integration

The current `validate` job is the fixture/static job: frozen install, contract checks, dependency
audit with the documented exception, lint, typecheck, unit tests, build, Playwright Chromium install,
and the fixture suite. A failing fixture run uploads its Playwright report with three-day retention;
the fixture suite contains no session material. The Phase 3A local-stack job (reset, pgTAP, DB lint,
generated-type drift, integration tests, local-mode smoke, unconditional stop) is added when Wave 1
supplies migrations and database tests; it cannot run meaningfully against an empty schema.

## Integration testing (Phase 3+)

For the founder-approved Phase 3A revision-3 local proof (final technical re-review pending):

- pgTAP tests cover grants, constraints, RLS and caller-bound database commands;
- Bun tests cover Zod contracts, cursor/URL policy and safe error mapping;
- server-function integration tests use the real local Supabase stack and user-scoped sessions;
- Playwright covers signup/login/logout and the approved persisted learning journey;
- direct-call tests attempt horizontal/vertical access bypass, CSRF, forged/expired sessions and
  private-resource existence leaks.

Later webhook, quota, referral and payment tests remain in their approved phases; they are not Phase 3
scope.

**Locations:** `supabase/tests/database/`, co-located `src/**/*.test.ts`,
`tests/integration/**/*.test.ts`, and `e2e/`

**Runners:** pgTAP via Supabase CLI, Bun test runner, Playwright. Vitest is not added without a proven
gap.

## Unit testing (Phase 3+)

When domain logic complexity justifies it:

- Test `features/` business logic
- Test `lib/` utilities
- Test validation schemas
- Test calculation/transformation functions

**Location:** Co-located `*.test.ts` files

**Framework:** Bun's built-in test runner for Phase 3; reconsider only if a concrete unsupported need
appears.

## Accessibility testing

### Automated checks (Phase 2)

Use Playwright + axe-core for baseline checks:

- Color contrast
- Heading hierarchy
- Form labels
- Alt text
- ARIA attributes
- Keyboard navigation

Phase 3A explicitly verifies keyboard order, visible focus, label/error association and focus movement
after validation for registration, login, profile update, join, enrol, completion, retry and
expired-session states on desktop and mobile.

### Manual checks (Phase 2)

- Screen reader testing (NVDA/JAWS on Windows, VoiceOver on Mac/iOS)
- Keyboard-only navigation
- Zoom to 200%
- Reduced motion
- High contrast mode

### WCAG target

- **Phase 2:** WCAG 2.1 Level A (baseline)
- **Phase 3+:** WCAG 2.1 Level AA (production target)

**Important:** Full WCAG validation requires expert accessibility review and real assistive technology testing. Automated tools catch ~30% of issues.

## Visual regression testing (Phase 2+)

Optional but recommended:

- Capture screenshots of key pages in stable states
- Compare against baseline on CI
- Flag visual changes for review

**Tools to consider:** Percy, Chromatic, or Playwright's built-in screenshot comparison

## Performance testing

### Phase 2 (Lighthouse)

- Run Lighthouse audits on key pages
- Target: Performance score > 90
- Mobile-first measurement

### Phase 3+ (Real User Monitoring)

- Add Core Web Vitals tracking
- Monitor LCP, FID, CLS
- Set performance budgets

## Security testing

### Phase 3+

- Dependency audit (`bun audit` or `npm audit`)
- Secret scanning (prevent committed secrets)
- SQL injection testing (parameterized queries)
- XSS testing (sanitized user content)
- CSRF protection
- Rate limit verification
- Authorization bypass testing

### Phase 7 (Payments)

- PCI DSS compliance review
- Payment provider security audit
- Webhook signature verification
- Idempotency testing

## Test data management

### Phase 2 (Fixtures)

- All test data is deterministic
- Fixtures live in `src/data/seed.ts` (fixed IDs and a fixed base date; no randomness or clock reads)
- No database cleanup needed

### Phase 3 local proof

- use only the disposable local Supabase database;
- rebuild deterministic catalogue state with `bunx supabase db reset`;
- keep pgTAP tests transactional and rolled back;
- create E2E users through the real signup flow with unique fictional addresses;
- do not seed or manipulate Supabase Auth internals for browser tests;
- never use a hosted project, real personal data or an app service-role key;
- delete ignored dumps/synthetic load data after recovery/performance evidence is captured.

## Quality gates

### PR merge requirements

Must pass:

- CI build
- Linter
- Typecheck
- E2E critical path
- Manual code review
- Documentation updates for architectural changes

### Phase completion requirements

Must deliver:

- All acceptance criteria met
- Critical flows verified in browser
- Mobile behavior checked
- Accessibility baseline checked
- Known gaps documented
- Durable documentation updated

## Testing anti-patterns

**DON'T:**

- Skip mobile testing
- Test implementation details (internal state, private functions)
- Copy-paste test code
- Write E2E tests for trivial UI variations
- Claim tests passed without running them
- Mock everything in integration tests
- Ignore flaky tests

**DO:**

- Test user-facing behavior
- Keep tests readable and maintainable
- Use realistic test data
- Test error paths
- Test edge cases
- Fix flaky tests immediately
- Run tests locally before pushing

## Coverage targets

### Phase 2

- E2E: 100% critical user journeys
- Unit: Not applicable (no complex logic yet)

### Phase 3+

- E2E: 100% critical journeys + 80% important flows
- Integration: 100% service adapters, 100% API routes
- Unit: 80% domain logic, 100% utilities

**Coverage is not a goal in itself.** A test suite with 100% coverage that doesn't test real user scenarios is useless.

## Test maintenance

- Review and update tests when requirements change
- Delete obsolete tests when features are removed
- Keep test runtime under 5 minutes for E2E suite
- Parallelize where possible
- Use test fixtures and helpers to reduce duplication

## Verification checklist (Definition of Done)

Before marking any phase complete:

- [ ] Critical user flows pass in Playwright
- [ ] Mobile viewport tested (Pixel 7)
- [ ] Keyboard navigation verified
- [ ] Error states tested
- [ ] Loading states tested
- [ ] Empty states tested
- [ ] Responsive breakpoints checked
- [ ] Accessibility baseline passed
- [ ] Linter passed
- [ ] Typecheck passed
- [ ] Build succeeded
- [ ] Manual code review completed
- [ ] Documentation updated

## Future testing considerations

### Phase 5+

- Load testing for live sessions
- Chaos engineering for provider failover
- Abuse/fraud scenario testing

### Phase 7+

- Payment flow testing (test mode)
- Refund scenario testing
- Webhook replay testing

### Phase 8+

- Marketplace flow testing
- Digital product download testing
- Creator payout calculation testing

### Phase 9+

- AI response quality testing
- Search relevance testing
- Recommendation accuracy testing

## Agent testing responsibilities

When an agent makes a code change:

1. Run relevant tests locally
2. Report exact test results (pass/fail counts, error messages)
3. Fix failures before claiming success
4. Add new tests for new features
5. Update tests when requirements change
6. Never claim tests passed without evidence

## Testing resources

- **Playwright docs:** https://playwright.dev
- **WCAG 2.1 guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **axe-core:** https://github.com/dequelabs/axe-core
- **Vitest:** https://vitest.dev (Phase 3+)
