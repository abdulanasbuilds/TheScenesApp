# UX State System

Status: implemented (frontend, fixture and connected UI).
Scope: non-happy-path states across the whole product — first-run, empty, no-results,
filtered, loading, error, offline, permission, success, partial and preview.

## Why

Every screen state must help the user move forward. A blank, silent or unexplained screen
reads as a broken product and loses activation and trust. Each state answers three questions:

1. Why is this happening?
2. What should I do next? (exactly one dominant action)
3. How does this build trust or momentum?

## Components

All live under `src/components/feedback/`.

| Export | File | Purpose |
| --- | --- | --- |
| `StateView` | `state-view.tsx` | The single primitive for blocking states (empty, no-results, filtered, loading, error, offline, permission, success, partial, setup, preview). |
| `StateIllustration` | `state-view.tsx` | Tone-tinted icon ring; decorative only (`aria-hidden`). |
| `SetupChecklist` | `state-view.tsx` | Compact static checklist for setup/permission states. |
| `InlineBanner` | `banner.tsx` | Non-blocking banners (degraded, offline, partial, preview, success). |
| `PreviewNotice` | `banner.tsx` | Calm, consistent preview-boundary notice. |
| `RoutePending` | `route-states.tsx` | Skeleton layout shown during slow navigation (`defaultPendingComponent`). |
| `RouteError` | `route-states.tsx` | Friendly recovery panel with retry + home + short non-secret reference (`defaultErrorComponent`). |
| `DegradedNotice` | `route-states.tsx` | One banner when a connected request fails, instead of a silent empty catalogue. |
| `ConnectivityBanner` | `route-states.tsx` | Offline notice with retry, driven by `navigator.onLine`. |

`EmptyState` in `src/components/ui/index.tsx` now delegates to `StateView`, so every existing
call site shares the same visual + accessibility language. It accepts the new optional props
(`type`, `tone`, `secondaryAction`, `helperText`, `checklist`, `meta`, `compact`) while keeping
the legacy `icon/title/description/action/className` shape.

## Global wiring

- `src/router.tsx`: `defaultPendingComponent: RoutePending`, `defaultErrorComponent: RouteError`.
- `src/routes/__root.tsx`: the loader now returns a `degraded: string[]` list per data source
  instead of silently converting failures to `null`; `RootComponent` renders `ConnectivityBanner`
  and `DegradedNotice` above the outlet. Fixture mode returns `degraded: []`.

## Usage

```tsx
<StateView
  type="no-results"
  icon={<Search className="h-5 w-5" />}
  title="No results found"
  description="Check the spelling or search all result types."
  helperText="Search covers scenes, courses, creators and resources."
  primaryAction={{ label: "Reset search", onClick: reset }}
  secondaryAction={{ label: "Browse all scenes", href: "/explore", variant: "secondary" }}
/>
```

Decision rules:

1. Failure (error/offline/permission) → recovery state, one retry.
2. Filtered (data exists, hidden) → reassure + reset.
3. Truly empty (no data yet) → teach the first action.
4. Success → reward + next loop.
5. Always one dominant, verb-first CTA.

## Copy rules

- Title ≤ 6 words; one or two short sentences; one-line helper.
- Plain, warm, honest voice. Never "Oops", "Uh oh" or "Nothing here".
- Name what happened, what to do next, and what is safe ("No changes were made").
- Keep preview honesty ("saved in this browser") instead of pretending a backend ran.

## Accessibility contract

- Loading → `role="status"`, `aria-live="polite"`, `aria-busy`.
- Error/permission → `role="alert"`, `aria-live="assertive"`.
- Offline/partial → `role="status"`, `aria-live="polite"`.
- Decorative icons are `aria-hidden`; the primary CTA is the first focusable element in the panel.
- Respects reduced motion (no decorative animation in state views).

## Verification

- `bun run typecheck` — clean.
- `bun run lint` — clean.
- `bun run test:fixture -- --workers=1` with the documented fixture driver
  (`RATE_LIMIT_DRIVER=memory`) — 35 passed, 22 skipped, 0 failed; includes the
  `visual-contract` route sweep on desktop, tablet and mobile.

### Environment note

The untracked `.env` sets `RATE_LIMIT_DRIVER=upstash` with placeholder credentials. In this
environment the Upstash call fails closed, so `password-reset` is limited to the emergency
allowance (2 per 15 minutes) and the parallel `password-recovery` spec can trip it. This is an
environment/integration condition, not a UI-state regression. Local fixture runs should use
`RATE_LIMIT_DRIVER=memory`, the documented fixture/local driver.

## Known follow-ups

- Convert remaining bespoke loading/error blocks to `StateView` as routes are touched.
- Add product analytics events: `state_viewed {type, route}` and `state_action_clicked`.
- Centralise state copy in a small registry if divergence appears across routes.