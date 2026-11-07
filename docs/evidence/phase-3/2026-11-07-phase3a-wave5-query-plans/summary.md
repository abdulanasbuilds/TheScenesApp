# Phase 3A Wave 5 — Query Plan Evidence

**Date:** 7 November 2026
**Target:** THE SCENES (`okdzuqgzgnmmbtjxdaci`) — pre-production, all application tables are empty
**Method:** `EXPLAIN (FORMAT JSON)` via Supabase MCP, read-only, no data mutation

All five core Wave 4 queries use index scans.
No sequential scan was observed on any user-scoped query.

## Q1 — Community discovery (public explore page)

```sql
SELECT id, slug, name, tagline, accent_hue
FROM public.communities
WHERE status = 'published' AND discoverability = 'listed'
ORDER BY published_at DESC, id DESC
LIMIT 50
```

**Plan:** `Limit → Index Scan on communities_discovery_idx`

Index `communities_discovery_idx` is a partial index
(`WHERE status = 'published' AND discoverability = 'listed'`)
ordered by `(published_at DESC, id DESC)`.
No table filter required; plan is index-only.

---

## Q2 — Own memberships (session initialization, home page sidebar)

```sql
SELECT community_id, role, status
FROM public.community_memberships
WHERE user_id = $1 AND status = 'active'
```

**Plan:** `Index Scan on community_memberships_user_status_idx`

Composite index on `(user_id, status, community_id)` satisfies both predicates
in a single index range scan.

---

## Q3 — Own enrollments (My Learning page, session initialization)

```sql
SELECT id, course_id, status, enrolled_at
FROM public.course_enrollments
WHERE user_id = $1 AND status = 'active'
ORDER BY updated_at DESC, id DESC
LIMIT 100
```

**Plan:** `Limit → Index Scan on course_enrollments_user_status_updated_idx`

Composite index on `(user_id, status, updated_at DESC, id DESC)` satisfies
both predicates and the ORDER BY without an additional sort step.

---

## Q4 — Lesson completions (progress loading)

```sql
SELECT lc.lesson_id, lc.course_id, lc.completed_at
FROM public.lesson_completions lc
JOIN public.course_enrollments ce ON ce.id = lc.enrollment_id
WHERE ce.user_id = $1 AND ce.status = 'active'
LIMIT 500
```

**Plan:** `Limit → Nested Loop (Index Only Scan on course_enrollments_user_status_updated_idx, Bitmap Index Scan on lesson_completions_enrollment_lesson_key)`

The enrollment side uses an Index Only Scan (no heap fetch); the completion
side uses a Bitmap Index Scan via the unique composite index on
`(enrollment_id, lesson_id)`. No sequential scan.

---

## Q5 — Profile lookup (every server function that verifies identity)

```sql
SELECT id, handle, display_name, headline, bio, location
FROM public.profiles
WHERE id = $1
```

**Plan:** `Index Scan on profiles_pkey`

Primary key lookup. Optimal.

---

## Assessment

| Query | Node type | Index used | Sequential scan |
|-------|-----------|-----------|----------------|
| Q1 community discovery | Index Scan | `communities_discovery_idx` | No |
| Q2 own memberships | Index Scan | `community_memberships_user_status_idx` | No |
| Q3 own enrollments | Index Scan | `course_enrollments_user_status_updated_idx` | No |
| Q4 lesson completions | Nested Loop / Index Only Scan | `course_enrollments_user_status_updated_idx`, `lesson_completions_enrollment_lesson_key` | No |
| Q5 profile lookup | Index Scan | `profiles_pkey` | No |

**Result:** All five Wave 4 application queries use index scans on the designed
indexes. No consolidation or additional indexes are required at this stage.
Wave 5 performance criterion is satisfied for the current empty-database baseline.

---

**Note:** Plans reflect an empty database. Actual cardinality estimates will
improve once representative data is present. Query plans should be re-evaluated
after the first significant data load. No timing or cost figure from an empty
database is claimed as a production benchmark.
