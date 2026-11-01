# End-to-end / browser verification

Playwright tests live here. Config: `playwright.config.ts`.

## Conventions

- `*.spec.ts` files, grouped by surface (`landing.spec.ts`, `explore.spec.ts`, `learner-home.spec.ts`, …).
- Prefer role/label/text locators (`getByRole`, `getByLabel`) over CSS selectors, so tests double as accessibility checks.
- No production data, no real payments, no production auth. Use deterministic fixtures only.
- Every test must be meaningful in both `chromium` and `mobile-chromium` projects, or be skipped explicitly with a reason.

## Commands

```bash
bunx playwright install chromium   # first run on a machine or in CI
bun run test:e2e                   # starts the dev server on :5000
bun run test:e2e:ui                # interactive
```

Artifacts (traces, screenshots, HTML report) land in `.playwright/` and are not committed.
