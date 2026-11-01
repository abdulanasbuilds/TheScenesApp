# The Scenes � Folder Structure

This document defines the canonical folder structure for The Scenes repository.

## Principle

The application is a **monorepo with internal module boundaries**, not a multi-package workspace.

All code lives under `src/`, organized by responsibility rather than technical layer.

## Root structure

```
TheScenesApp/
+-- src/                    # All application code
+-- public/                 # Static assets (fonts, images, icons)
+-- e2e/                    # Playwright end-to-end tests
+-- docs/                   # Project documentation
+-- .github/workflows/      # CI configuration
+-- node_modules/           # Dependencies (gitignored)
+-- .playwright/            # Test artifacts (gitignored)
+-- package.json            # Dependencies and scripts
+-- tsconfig.json           # TypeScript configuration
+-- vite.config.ts          # Vite/TanStack Start configuration
+-- playwright.config.ts    # Playwright configuration
+-- eslint.config.js        # ESLint configuration
+-- .prettierrc             # Prettier configuration
+-- components.json         # shadcn/ui configuration
+-- AGENTS.md               # Universal agent contract
+-- README.md               # Project overview
```

## src/ structure

```
src/
+-- app/                    # TanStack Start app directory (routes + SSR)
+-- components/             # Shared React components
+-- features/               # Feature modules (domain logic)
+-- services/               # External service adapters
+-- lib/                    # Shared utilities and hooks
+-- types/                  # Shared TypeScript types
+-- fixtures/               # Mock data for Phase 2
+-- styles/                 # Global styles
+-- server/                 # Server-side code (Phase 3+)
+-- client.tsx              # Client entry point
```

## app/ � TanStack Start routes

```
src/app/
+-- routes/                 # File-based routing
�   +-- __root.tsx          # Root layout with error boundary
�   +-- index.tsx           # Marketing landing page
�   +-- explore.tsx         # Public discovery
�   +-- categories/         # Category pages
�   +-- communities/        # Community routes
�   +-- courses/            # Course routes
�   +-- events/             # Event routes
�   +-- workflows/          # Workflow/resource routes
�   +-- teachers/           # Teacher profile routes
�   +-- auth/               # Auth routes (signup, login, etc.)
�   +-- home.tsx            # Authenticated home (separate from landing)
�   +-- my-learning.tsx     # Learner dashboard
�   +-- workspace/          # Creator workspace routes
�   +-- admin/              # Admin workspace routes
�   +-- settings/           # Settings routes
�   +-- legal/              # Legal pages (terms, privacy)
+-- ssr.tsx                 # SSR entry point
```

**Routing rules:**

- `/` ? marketing landing page (public)
- `/explore` ? public discovery
- `/home` ? authenticated home (distinct from landing)
- `/workspace/*` ? creator workspace
- `/admin/*` ? admin workspace
- `/my-learning` ? learner dashboard

## components/ � Shared UI components

```
src/components/
+-- ui/                     # shadcn/Radix primitives (button, dialog, etc.)
+-- layout/                 # Shells, navigation, headers, footers
�   +-- app-shell.tsx       # Main authenticated app shell
�   +-- marketing-shell.tsx # Public marketing shell
�   +-- navigation.tsx      # Main navigation
�   +-- mobile-nav.tsx      # Mobile navigation
+-- community/              # Community-specific components
�   +-- community-card.tsx
�   +-- post-card.tsx
�   +-- comment-thread.tsx
�   +-- ...
+-- learning/               # Course/lesson components
�   +-- course-card.tsx
�   +-- lesson-player.tsx
�   +-- progress-bar.tsx
�   +-- ...
+-- creator/                # Creator workspace components
�   +-- course-builder.tsx
�   +-- analytics-chart.tsx
�   +-- earnings-summary.tsx
�   +-- ...
+-- admin/                  # Admin components
�   +-- user-table.tsx
�   +-- moderation-queue.tsx
�   +-- ...
+-- shared/                 # Cross-cutting components
    +-- avatar.tsx
    +-- badge.tsx
    +-- empty-state.tsx
    +-- loading-state.tsx
    +-- error-state.tsx
    +-- ...
```

**Component rules:**

- `ui/` contains only primitive/unstyled components from shadcn/Radix
- Domain components (`community/`, `learning/`, etc.) compose primitives
- Shared layout components go in `layout/`
- Keep components focused and composable

## features/ � Feature modules (business logic)

```
src/features/
+-- auth/                   # Authentication (Phase 3+)
�   +-- hooks/
�   +-- context/
�   +-- utils.ts
�   +-- types.ts
+-- community/              # Community domain logic
�   +-- hooks/
�   +-- utils.ts
�   +-- types.ts
+-- learning/               # Learning/courses logic
�   +-- hooks/
�   +-- progress-tracker.ts
�   +-- completion.ts
�   +-- types.ts
+-- events/                 # Events/live logic
�   +-- hooks/
�   +-- scheduling.ts
�   +-- types.ts
+-- referrals/              # Referral system logic
�   +-- hooks/
�   +-- qualification.ts
�   +-- entitlements.ts
�   +-- types.ts
+-- gamification/           # Points, progress, badges
�   +-- hooks/
�   +-- points.ts
�   +-- types.ts
+-- marketplace/            # Marketplace logic (Phase 8)
    +-- hooks/
    +-- types.ts
```

**Feature rules:**

- Features contain **domain logic**, not UI components
- Each feature is independently testable
- Features may import from `services/` but not vice versa
- Keep feature boundaries clean (no cross-feature imports)

## services/ � External service adapters

```
src/services/
+-- auth/                   # Auth adapter (Supabase, Phase 3+)
�   +-- index.ts            # Public interface
�   +-- supabase-adapter.ts # Implementation
�   +-- mock-adapter.ts     # Mock for Phase 2
�   +-- types.ts
+-- storage/                # Storage adapter (R2, Phase 4+)
�   +-- index.ts
�   +-- r2-adapter.ts
�   +-- mock-adapter.ts
�   +-- types.ts
+-- email/                  # Email adapter (Resend, Phase 4+)
�   +-- index.ts
�   +-- resend-adapter.ts
�   +-- mock-adapter.ts
�   +-- types.ts
+-- video/                  # Video adapter (Bunny/LiveKit, Phase 6+)
�   +-- index.ts
�   +-- bunny-adapter.ts
�   +-- livekit-adapter.ts
�   +-- mock-adapter.ts
�   +-- types.ts
+-- payments/               # Payment adapter (Phase 7+)
    +-- index.ts
    +-- paystack-adapter.ts
    +-- mock-adapter.ts
    +-- types.ts
```

**Adapter rules:**

- Each service has a **provider-agnostic interface** in `index.ts`
- Implementation files (e.g., `supabase-adapter.ts`) are private to the module
- Mock adapters return deterministic fixture data in Phase 2
- Real adapters are only activated in the appropriate phase
- Never expose provider-specific types outside the adapter

## lib/ � Shared utilities

```
src/lib/
+-- utils.ts                # General utilities
+-- cn.ts                   # Tailwind merge (classname utility)
+-- constants.ts            # App-wide constants
+-- hooks/                  # React hooks
�   +-- use-media-query.ts
�   +-- use-debounce.ts
�   +-- ...
+-- validation/             # Validation schemas
    +-- schemas.ts
```

**Utility rules:**

- Keep utilities pure and side-effect free
- No domain logic here (use `features/` instead)
- Hooks are reusable UI hooks, not domain hooks (those go in `features/`)

## types/ � Shared TypeScript types

```
src/types/
+-- domain.ts               # Core domain models (User, Course, Community, etc.)
+-- api.ts                  # API request/response contracts
+-- fixtures.ts             # Fixture data types (Phase 2)
+-- index.ts                # Re-exports
```

**Type rules:**

- Domain types are the canonical data structures
- API types may differ from domain types (transformation happens in adapters)
- Never import provider-specific types here

## fixtures/ � Mock data for Phase 2

```
src/fixtures/
+-- users.ts                # Mock users
+-- courses.ts              # Mock courses
+-- communities.ts          # Mock communities
+-- events.ts               # Mock events
+-- referrals.ts            # Mock referral data
+-- analytics.ts            # Mock analytics
+-- index.ts                # Re-exports
```

**Fixture rules:**

- All fixture data is **deterministic** (same output every time)
- Fixtures match the shape of real data from domain types
- Phase 2 uses fixtures exclusively; Phase 3+ replaces with real data
- Fixtures should represent realistic product states (empty, loading, populated, error)

## styles/ � Global styles

```
src/styles/
+-- globals.css             # Tailwind imports + global overrides
```

**Style rules:**

- Use Tailwind utility classes for component styling
- Keep global CSS minimal
- Component-specific styles should use inline Tailwind classes

## server/ � Server-side code (Phase 3+)

```
src/server/
+-- api/                    # API route handlers
�   +-- auth.ts
�   +-- courses.ts
�   +-- communities.ts
�   +-- ...
+-- db/                     # Database client
�   +-- client.ts
�   +-- schema.ts
�   +-- migrations/
+-- middleware/             # Server middleware
�   +-- auth.ts
�   +-- rate-limit.ts
+-- utils/                  # Server-only utilities
    +-- validation.ts
```

**Server rules:**

- Server code MUST NOT be imported in client code
- Use TanStack Start's `server-only` import protection
- All server routes require authorization checks
- Never expose secrets to the client

## public/ � Static assets

```
public/
+-- fonts/                  # Web fonts
+-- images/                 # Images (logo, hero, etc.)
+-- icons/                  # Favicons, PWA icons
```

**Asset rules:**

- Static files are served from `/` root
- Optimize images before committing
- Use SVG for icons where possible
- Font files should be subsetted

## e2e/ � Playwright tests

```
e2e/
+-- landing.spec.ts         # Landing page tests
+-- auth.spec.ts            # Authentication flows
+-- courses.spec.ts         # Course navigation/learning
+-- community.spec.ts       # Community interactions
+-- workspace.spec.ts       # Creator workspace
+-- helpers/                # Test utilities
    +-- fixtures.ts
```

**Test rules:**

- Test critical user flows, not every component
- Use Page Object Model for complex flows
- Tests run against localhost:5000 in CI
- Mobile tests are included (Pixel 7 viewport)

## docs/ � Project documentation

```
docs/
+-- README.md                           # Documentation index
+-- AGENT-CONTEXT.md                    # Bootstrap context for agents
+-- AGENT-PROMPT-TEMPLATE.md            # Task prompt template
+-- AGENT-ROLES.md                      # Agent role definitions
+-- BUILD-CONTRACT.md                   # Build requirements
+-- CI-CONTRACT.md                      # CI requirements
+-- DECISIONS.md                        # Architecture Decision Register
+-- DESIGN-FIRST.md                     # Design-first workflow
+-- ENVIRONMENT-AND-COST-GUARDRAILS.md  # Cost/env safety rules
+-- FEATURE-MATRIX.md                   # Feature traceability
+-- FOLDER-STRUCTURE.md                 # This file
+-- INTEGRATIONS.md                     # Provider boundaries
+-- LEGACY-CONTEXT.md                   # SukaSpace history
+-- LEGACY-SOURCE-INVENTORY.md          # Legacy file inventory
+-- OPEN-PRODUCT-DECISIONS.md           # Unresolved questions
+-- PHASES.md                           # 10-phase roadmap
+-- PLAIN-ENGLISH-PRODUCT-EXPLANATION.md # Non-technical overview
+-- PRODUCT-REQUIREMENTS.md             # Canonical requirements
+-- PROJECT-CONTEXT.md                  # Product context
+-- REFERRAL-QUOTA-ARCHITECTURE.md      # Referral system design
+-- REWARD-INFRASTRUCTURE.md            # Reward system details
+-- SECURITY-RULES.md                   # Security baseline
+-- TESTING-AND-QUALITY.md              # Testing strategy
+-- TOOLING.md                          # Tools and capabilities
+-- AGENT-GUIDES/                       # Agent-specific guides
    +-- FABLE.md
```

## Import rules

### Allowed imports

- `app/` ? `components/`, `features/`, `services/`, `lib/`, `types/`, `fixtures/`, `styles/`
- `components/` ? `lib/`, `types/`, `ui/` (within components/)
- `features/` ? `services/`, `lib/`, `types/`
- `services/` ? `lib/`, `types/`
- `lib/` ? nothing (pure utilities)
- `types/` ? nothing (pure types)
- `fixtures/` ? `types/`
- `server/` ? `services/`, `lib/`, `types/` (but NEVER vice versa)

### Forbidden imports

- `services/` ? `features/` (adapters don't know about domain logic)
- `services/` ? `components/` (adapters don't know about UI)
- `lib/` ? anything (utilities are isolated)
- Client code ? `server/` (import protection enforced by TanStack Start)
- Cross-feature imports (features are independent)

## File naming conventions

- React components: PascalCase (`CourseCard.tsx`)
- Utilities/functions: kebab-case (`format-date.ts`)
- Types: kebab-case (`domain-types.ts`)
- Test files: `*.spec.ts` (E2E), `*.test.ts` (unit, when added)
- Route files: kebab-case (`my-learning.tsx`)

## Phase-specific rules

### Phase 0 (Current � Documentation)

- No `src/` directory yet
- All documentation in `docs/`
- CI checks documentation integrity

### Phase 1 (Design Exploration)

- Create design artifacts (mockups, prototypes)
- No production code yet
- Document design decisions

### Phase 2 (Frontend with Fixtures)

- Create full `src/` structure
- All service adapters return fixture data
- No real backend connections
- Focus: navigable UI with realistic states

### Phase 3 (Backend Foundation)

- Activate real auth adapter (Supabase)
- Create `server/` directory
- Add database client
- Replace fixture adapters with real implementations

### Phase 4+ (Progressive Integration)

- Activate adapters progressively by phase
- Each phase unlocks specific `services/` implementations
- Old fixture code remains for reference/testing

## Monorepo vs multi-package

The Scenes uses a **monorepo-style structure** (single package.json, internal modules) rather than a multi-package workspace (multiple package.json files).

**Rationale:**

- Simpler dependency management
- No version coordination between packages
- Easier refactoring across boundaries
- Standard TypeScript path aliases (`@/components`, `@/lib`, etc.)
- Sufficient for current scale

If the application grows to need separate deployable units (e.g., separate marketing site, API server, admin dashboard), the architecture can be revisited in Phase 10.

## Update rule

When new architectural boundaries are introduced, update this document in the same commit.
