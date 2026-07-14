# SukaSpace

A community + course platform ("community and courses, engineered for the AI era") — creators can launch communities, sell courses, and manage members; learners can join communities, take courses, and track progress.

## Stack
- **Framework**: TanStack Start (React 19) + TanStack Router, built with Vite
- **Styling**: Tailwind CSS v4 + Radix UI primitives (shadcn/ui-style components in `src/components/ui`)
- **Data**: Client-side only for now — a React Context store (`AppStoreProvider`/`useAppStore`) persisted to `localStorage` (key `sukaspace_app_state_v3`) drives all interactive features (auth, communities, courses, posts, payments demo, etc). No backend API is wired up yet.
- **Database**: A Replit-native PostgreSQL database is provisioned and its schema (`profiles`, `communities`, `courses`, `enrollments`, `messages`, `payments`, `notifications`, plus supporting tables) lives in `src/lib/db.ts` as `MIGRATION_SQL`. It is not yet wired into the app — it's the target schema for when server-side persistence (via TanStack Start server functions) is added.
- Runtime: **Bun**

## Running the app
- Dev server: `bun run dev` (configured as the "Start application" workflow, serves on port 5000)
- Build: `bun run build`
- Lint: `bun run lint`

## Notes for future setup after re-import
- If `bun run dev` fails with `vite: command not found`, run `bun install` — dependencies aren't committed to git.
- Each fresh import gets a brand-new empty Postgres database. If tables are missing, re-run the schema from `src/lib/db.ts`'s `MIGRATION_SQL` against `$DATABASE_URL` (e.g. extract the SQL and pipe it to `psql "$DATABASE_URL"`).

## User preferences
- No real backend/third-party integrations (Supabase, auth providers, etc.) should be wired in unless the user explicitly asks — everything should stay mocked/local until they request real persistence.
