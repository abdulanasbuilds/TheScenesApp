---
name: SukaSpace client-only data layer
description: This project (SukaSpace, TanStack Start community+course app) has no backend — persistence is a client-side React context store. Read before adding features that seem to need a database.
---

The app was imported with only static `MOCK_*` arrays (`src/lib/mock-data.ts`) and no persistence layer, no zustand/redux. Per explicit user constraint, no real backend/integrations (Supabase, auth providers, etc.) should be wired in — everything must be mocked/local until the user connects their own backend.

A lightweight fake backend was added: React Context (`AppStoreProvider`/`useAppStore`) holding session, communities, posts, likes, joins, and notifications, persisted to `localStorage`. It merges user-created data with the original seed arrays rather than replacing them.

**Why:** keeps the interactive demo fully functional (create community → shows in Discover, post → shows in feed, etc.) without touching any real service, matching the "everything client-side, no integrations" requirement.

**How to apply:** any new feature needing "persisted" state in this app should extend the existing store (add a field to `PersistedState` + actions), not introduce a new state system or a real database. SSR-safety pattern: guard `typeof window`, seed with a deterministic default on first render, then hydrate from `localStorage` in a `useEffect`, and gate the localStorage *write* effect on an `isHydrated` flag — otherwise SSR/client hydration mismatches or accidental overwrites of stored state occur.

**Bug pattern to watch for:** one page (`discover.tsx`) computed a `filtered` list from state/search but the JSX unconditionally rendered a hardcoded `ZeroState` component instead of the computed list — the computation was correct but never consumed. When auditing "why doesn't X show up" bugs, check that filtered/derived data is actually reached by the render path, not just computed.
