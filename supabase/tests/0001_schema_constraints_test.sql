-- Phase 3A Wave 1 — schema, constraint, and referential-action tests.
-- Contract: docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md §9.
--
-- Run with: supabase test db --local

begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select no_plan();

-- ---------------------------------------------------------------------------
-- Objects and RLS coverage
-- ---------------------------------------------------------------------------

select has_schema('private', 'private schema exists');

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'workspaces', 'workspaces exists');
select has_table('public', 'workspace_memberships', 'workspace_memberships exists');
select has_table('public', 'categories', 'categories exists');
select has_table('public', 'communities', 'communities exists');
select has_table('public', 'community_categories', 'community_categories exists');
select has_table('public', 'community_memberships', 'community_memberships exists');
select has_table('public', 'courses', 'courses exists');
select has_table('public', 'course_outcomes', 'course_outcomes exists');
select has_table('public', 'course_modules', 'course_modules exists');
select has_table('public', 'lessons', 'lessons exists');
select has_table('public', 'lesson_contents', 'lesson_contents exists');
select has_table('public', 'lesson_resources', 'lesson_resources exists');
select has_table('public', 'course_enrollments', 'course_enrollments exists');
select has_table('public', 'lesson_completions', 'lesson_completions exists');
select has_table('private', 'audit_events', 'private.audit_events exists');

select is(
  (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname = any (
        array[
          'profiles', 'workspaces', 'workspace_memberships', 'categories', 'communities',
          'community_categories', 'community_memberships', 'courses', 'course_outcomes',
          'course_modules', 'lessons', 'lesson_contents', 'lesson_resources',
          'course_enrollments', 'lesson_completions'
        ]
      )
      and not c.relrowsecurity
  ),
  0::bigint,
  'RLS is enabled on every exposed table'
);

-- Every composite FK target has a unique index.
select has_index('public', 'communities', 'communities_id_workspace_key', 'community tenant key indexed');
select has_index('public', 'courses', 'courses_id_workspace_key', 'course tenant key indexed');
select has_index('public', 'course_modules', 'course_modules_course_id_key', 'module composite key indexed');
select has_index('public', 'lessons', 'lessons_course_id_key', 'lesson composite key indexed');
select has_index('public', 'course_enrollments', 'course_enrollments_id_course_key', 'enrolment composite key indexed');

select has_index('public', 'communities', 'communities_discovery_idx', 'discovery keyset index exists');
select has_index('public', 'courses', 'courses_community_list_idx', 'community course keyset index exists');
select has_index('public', 'course_enrollments', 'course_enrollments_user_updated_idx', 'My Learning index exists');
select has_index('public', 'course_enrollments', 'course_enrollments_user_status_updated_idx', 'filtered My Learning index exists');

-- ---------------------------------------------------------------------------
-- Formats, bounds, and named CHECK constraints
-- ---------------------------------------------------------------------------

select throws_ok(
  $sql$ insert into public.categories (slug, name, blurb, accent_hue)
        values ('design', 'Duplicate Design', 'duplicate', 10) $sql$,
  '23505',
  'duplicate category slug is rejected'
);

select throws_ok(
  $sql$ insert into public.categories (slug, name, blurb, accent_hue)
        values ('Bad Slug', 'Bad', 'bad', 10) $sql$,
  '23514',
  'non-lowercase slug is rejected'
);

select throws_ok(
  $sql$ insert into public.categories (slug, name, blurb, accent_hue)
        values ('bad-hue', 'Bad hue', 'bad', 400) $sql$,
  '23514',
  'accent hue outside 0..359 is rejected'
);

select throws_ok(
  $sql$ insert into public.categories (slug, name, blurb, accent_hue)
        values ('short-blurb', 'x', '', 10) $sql$,
  '23514',
  'empty category blurb is rejected'
);

select throws_ok(
  $sql$ insert into public.communities (
          workspace_id, slug, name, tagline, description, privacy, join_policy,
          status, accent_hue, languages
        )
        values (
          '20000000-0000-4000-8000-000000000001', 'private-open', 'Private Open',
          'tagline', 'description', 'private', 'open', 'draft', 10, array['en']
        ) $sql$,
  '23514',
  'private community cannot use an open join policy'
);

select throws_ok(
  $sql$ insert into public.communities (
          workspace_id, slug, name, tagline, description, privacy, join_policy,
          status, accent_hue, languages
        )
        values (
          '20000000-0000-4000-8000-000000000001', 'published-no-date', 'Published No Date',
          'tagline', 'description', 'public', 'open', 'published', 10, array['en']
        ) $sql$,
  '23514',
  'published community requires published_at'
);

select throws_ok(
  $sql$ insert into public.communities (
          workspace_id, slug, name, tagline, description, privacy, join_policy,
          status, accent_hue, languages
        )
        values (
          '20000000-0000-4000-8000-000000000001', 'bad-language', 'Bad Language',
          'tagline', 'description', 'public', 'open', 'draft', 10, array['English']
        ) $sql$,
  '23514',
  'invalid language tag is rejected'
);

select throws_ok(
  $sql$ insert into public.communities (
          workspace_id, slug, name, tagline, description, privacy, join_policy,
          status, accent_hue, languages
        )
        values (
          '20000000-0000-4000-8000-000000000001', 'dup-language', 'Dup Language',
          'tagline', 'description', 'public', 'open', 'draft', 10, array['en', 'en']
        ) $sql$,
  '23514',
  'duplicate language tags are rejected'
);

-- ---------------------------------------------------------------------------
-- Composite tenant and course consistency
-- ---------------------------------------------------------------------------

select throws_ok(
  $sql$ insert into public.courses (
          workspace_id, community_id, instructor_id, slug, title, subtitle,
          description, level, access, status
        )
        values (
          '20000000-0000-4000-8000-000000000002',
          '40000000-0000-4000-8000-000000000001',
          '10000000-0000-4000-8000-000000000001',
          'cross-workspace-course', 'Cross Workspace', 'subtitle',
          'description', 'beginner', 'included', 'draft'
        ) $sql$,
  '23503',
  'a course cannot join a community owned by another workspace'
);

select throws_ok(
  $sql$ insert into public.lessons (
          course_id, module_id, slug, title, summary, kind, duration_minutes,
          is_preview, position
        )
        values (
          '50000000-0000-4000-8000-000000000001',
          '70000000-0000-4000-8000-000000000003',
          'cross-course-lesson', 'Cross Course Lesson', 'summary', 'reading', 5, false, 99
        ) $sql$,
  '23503',
  'a lesson cannot reference a module from another course'
);

-- Valid enrolment used to prove the completion composite FK rejects a cross-course lesson.
insert into public.course_enrollments (course_id, user_id, status, source)
values ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'active', 'seed');

select throws_ok(
  $sql$ insert into public.lesson_completions (enrollment_id, lesson_id, course_id)
        select e.id, '80000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000001'
        from public.course_enrollments e
        where e.course_id = '50000000-0000-4000-8000-000000000001'
          and e.user_id = '10000000-0000-4000-8000-000000000003' $sql$,
  '23503',
  'a completion cannot link a lesson from another course'
);

-- ---------------------------------------------------------------------------
-- At-most-one invariants
-- ---------------------------------------------------------------------------

select throws_ok(
  $sql$ insert into public.workspace_memberships (workspace_id, user_id, role, status)
        values (
          '20000000-0000-4000-8000-000000000001',
          '10000000-0000-4000-8000-000000000003',
          'owner', 'active'
        ) $sql$,
  '23505',
  'a workspace cannot have two active owners'
);

select throws_ok(
  $sql$ insert into public.community_categories (community_id, category_id, is_primary)
        values (
          '40000000-0000-4000-8000-000000000001',
          '30000000-0000-4000-8000-000000000004',
          true
        ) $sql$,
  '23505',
  'a community cannot have two primary categories'
);

select throws_ok(
  $sql$ insert into public.workspace_memberships (workspace_id, user_id, role, status)
        values (
          '20000000-0000-4000-8000-000000000001',
          '10000000-0000-4000-8000-000000000001',
          'editor', 'active'
        ) $sql$,
  '23505',
  'a workspace membership is unique per user'
);

-- ---------------------------------------------------------------------------
-- Lesson content and resource shape
-- ---------------------------------------------------------------------------

select throws_ok(
  $sql$ insert into public.lesson_contents (lesson_id, body)
        values ('80000000-0000-4000-8000-000000000002', '[]'::jsonb) $sql$,
  '23514',
  'lesson content must contain at least one block'
);

select throws_ok(
  $sql$ insert into public.lesson_contents (lesson_id, body)
        values ('80000000-0000-4000-8000-000000000002', '{"type":"paragraph"}'::jsonb) $sql$,
  '23514',
  'lesson content body must be a JSON array'
);

select throws_ok(
  $sql$ insert into public.lesson_resources (lesson_id, label, kind, url, position)
        values (
          '80000000-0000-4000-8000-000000000001', 'Insecure', 'link',
          'http://resources.thescenes.example/x', 99
        ) $sql$,
  '23514',
  'lesson resource URLs must be https'
);

select throws_ok(
  $sql$ insert into public.lesson_resources (lesson_id, label, kind, url, position)
        values (
          '80000000-0000-4000-8000-000000000001', 'Credentials', 'link',
          'https://user:pass@resources.thescenes.example/x', 98
        ) $sql$,
  '23514',
  'lesson resource URLs cannot embed credentials'
);

select throws_ok(
  $sql$ insert into public.lesson_resources (lesson_id, label, kind, url, position)
        values (
          '80000000-0000-4000-8000-000000000001', 'Bad kind', 'video',
          'https://resources.thescenes.example/x', 97
        ) $sql$,
  '23514',
  'lesson resource kind is bounded'
);

-- ---------------------------------------------------------------------------
-- Audit shape
-- ---------------------------------------------------------------------------

select throws_ok(
  $sql$ insert into private.audit_events (actor_id, action, target_type, target_id, request_id)
        values (
          '10000000-0000-4000-8000-000000000003', 'unknown.action', 'community',
          '40000000-0000-4000-8000-000000000001', gen_random_uuid()
        ) $sql$,
  '23514',
  'audit action is bounded'
);

select throws_ok(
  $sql$ insert into private.audit_events (actor_id, action, target_type, target_id, request_id)
        values (
          '10000000-0000-4000-8000-000000000003', 'community.joined', 'community',
          '40000000-0000-4000-8000-000000000001', null
        ) $sql$,
  '23502',
  'audit request id is required'
);

select * from finish();

rollback;
