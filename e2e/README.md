# End-to-end / browser verification

Playwright tests live here. Config: `playwright.config.ts`.

## Conventions

- `*.spec.ts` files, grouped by surface (`landing.spec.ts`, `explore.spec.ts`, `learner-home.spec.ts`, …).
- Prefer role/label/text locators (`getByRole`, `getByLabel`) over CSS selectors, so tests double as accessibility checks.
- No production data, payments, hosted auth or remote provider. Fixture tests use deterministic data;
  Phase 3A tests use only fictional accounts in the isolated local stack.
- Suites declare `fixtures` or `supabase-local` explicitly and assert the rendered mode marker. A test
  never reuses a server from the wrong mode.
- Phase 3A is Chromium-only. User-flow tests run in `desktop`, `tablet`, and `mobile`, or skip with a
  recorded reason when the assertion is viewport-independent.

## Commands

```bash
bunx playwright install chromium   # local first run
bunx playwright install --with-deps chromium # CI
bun run test:fixture               # accepted Phase 2 suite, fixture mode
bun run test:phase3                # isolated local Auth/learning/security suite
bun run test:e2e                   # current fixture alias during the planning gate
bun run test:e2e:ui                # interactive
```

Artifacts (traces, screenshots, HTML report) land in `.playwright/` and are not committed.
