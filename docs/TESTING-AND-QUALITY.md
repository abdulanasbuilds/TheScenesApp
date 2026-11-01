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
- **Projects:** `chromium` (desktop), `mobile-chromium` (Pixel 7)

### Commands

```bash
bun run test:e2e          # Run all E2E tests
bun run test:e2e:ui       # Interactive mode
bun run test:e2e:report   # View last test report
```

### Test organization

```
e2e/
+-- landing.spec.ts         # Marketing landing page
+-- explore.spec.ts         # Public discovery
+-- auth.spec.ts            # Signup, login, logout flows (Phase 3+)
+-- courses.spec.ts         # Course browsing, enrollment, learning
+-- community.spec.ts       # Community feed, posts, comments
+-- events.spec.ts          # Event discovery, registration
+-- workspace.spec.ts       # Creator workspace flows
+-- admin.spec.ts           # Admin workspace flows
+-- referrals.spec.ts       # Referral dashboard (Phase 5+)
+-- responsive.spec.ts      # Mobile/tablet/desktop checks
+-- accessibility.spec.ts   # Basic a11y checks
+-- helpers/                # Shared test utilities
    +-- fixtures.ts
    +-- selectors.ts
    +-- auth-helpers.ts
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

Every critical flow must pass on `mobile-chromium` (Pixel 7 viewport).

Desktop-only failures are acceptable for admin/creator tools in Phase 2 if mobile support is documented as Phase 3 work.

### CI integration

E2E tests run in GitHub Actions on every PR and push to `main`:

- Install Playwright browsers (`bunx playwright install chromium`)
- Start dev server on port 5000
- Run full test suite
- Upload failure artifacts

## Integration testing (Phase 3+)

Once backend services are activated:

- Test service adapter contracts
- Test API routes with real database
- Test authorization/RLS policies
- Test webhook handling
- Test quota enforcement
- Test referral qualification logic
- Test payment webhook idempotency

**Location:** `src/services/*/tests/`, `src/server/api/tests/`

**Framework:** Vitest (to be added in Phase 3)

## Unit testing (Phase 3+)

When domain logic complexity justifies it:

- Test `features/` business logic
- Test `lib/` utilities
- Test validation schemas
- Test calculation/transformation functions

**Location:** Co-located `*.test.ts` files

**Framework:** Vitest (to be added in Phase 3)

## Accessibility testing

### Automated checks (Phase 2)

Use Playwright + axe-core for baseline checks:

- Color contrast
- Heading hierarchy
- Form labels
- Alt text
- ARIA attributes
- Keyboard navigation

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
- Fixtures in `src/fixtures/`
- No database cleanup needed

### Phase 3+ (Real Database)

- Use separate test database
- Transaction rollback after each test
- Seed known test data
- Factory pattern for test objects

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
