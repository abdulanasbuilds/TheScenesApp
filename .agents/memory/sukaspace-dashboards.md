---
name: SukaSpace dashboards + auth
description: Learner and Creator dashboard architecture, auth flow, and DB schema details
---

## Learner Dashboard — /app/dashboard
- 5 tabs: Overview | Learning | Communities | Calendar | Messages
- Data sourced from useAppStore(): enrolled courses via isEnrolled(), joined communities via isJoined(), events via getCommunityEvents(), posts/notifications
- CourseProgressCard reads getCourseProgress(courseId) for progress bars
- EmptySection component reused across tabs

## Creator Dashboard — /app/creator
- 7 tabs: Overview | Communities | Courses | Members | Payments | Analytics | Settings
- recharts LineChart (enrollment trend) + BarChart (per-course) in Analytics tab
- Payments tab shows $0 balance card + empty transaction table, ready to wire
- Members tab shows a table populated from store.session + mock member rows; grows as real members join

## Auth fixes
- Signup now has role selector (Learn/Create cards) — passes role to store.signUp()
- After signin: reads account.role from store.accounts BEFORE signIn() call, then navigates creator→/app/creator, learner→/app/dashboard
- create-community.tsx: useEffect guard redirects to /auth if !store.session
- auth.tsx: useEffect guard redirects logged-in users away from /auth to their dashboard
- onboarding.tsx: finishOnboarding() now navigates to role-based dashboard

## AppShell nav — role-based
- CREATOR_NAV: Creator Hub first, then Community, Courses, Classroom, Members, Calendar, Messages, Payouts, Search, Settings
- LEARNER_NAV: Dashboard first, then Community, Classroom, Courses, Calendar, Messages, Search, Settings
- Mobile bottom nav is dynamically built from the role-appropriate set

## PostgreSQL (Replit native)
- 7 tables created: profiles, communities, courses, enrollments, messages, payments, notifications
- Indexes on: communities.creator_email, courses.creator_email, enrollments.user_email, notifications.user_email, payments.to_email
- Full schema with extended tables (course_modules, lessons, lesson_resources, community_members, community_resources, enrollment_progress, access_records) documented in src/lib/db.ts
- pg package installed (v8.22.0)
- Migration ran successfully via Bun script against DATABASE_URL

**Why:** pg cannot be imported in browser/client code — it's server-only. Dashboards use localStorage store for display. DB is the write-through layer for production wiring via TanStack Start createServerFn.
