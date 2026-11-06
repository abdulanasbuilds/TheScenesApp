-- Phase 3A Wave 1 — ACL, default-privilege, and function-execute tests.
-- Contract: docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md §5 and §6.
--
-- Run with: supabase test db --local

begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select no_plan();

-- ---------------------------------------------------------------------------
-- Schema access
-- ---------------------------------------------------------------------------

select is(
  has_schema_privilege('authenticated', 'private', 'USAGE'),
  true,
  'authenticated may use the private schema'
);
select isnt(
  has_schema_privilege('anon', 'private', 'USAGE'),
  true,
  'anon cannot use the private schema'
);

-- No default privilege may automatically expose a future public object to a client role. Privileges
-- for the owning roles are out of scope; the assertions target PUBLIC, anon, authenticated, and
-- service_role only.
select is(
  (
    select count(*)
    from pg_default_acl d
    join pg_namespace n on n.oid = d.defaclnamespace
    cross join lateral aclexplode(d.defaclacl) a
    where n.nspname = 'public'
      and d.defaclrole = 'postgres'::regrole
      and (
        a.grantee = 0
        or a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole)
      )
  ),
  0::bigint,
  'no default client or PUBLIC privileges exist in the public schema'
);

-- ---------------------------------------------------------------------------
-- profiles: column-scoped read and update
-- ---------------------------------------------------------------------------

select is(has_column_privilege('anon', 'public.profiles', 'id', 'SELECT'), true, 'anon reads profiles.id');
select is(has_column_privilege('anon', 'public.profiles', 'handle', 'SELECT'), true, 'anon reads profiles.handle');
select is(has_column_privilege('anon', 'public.profiles', 'display_name', 'SELECT'), true, 'anon reads profiles.display_name');
select is(has_column_privilege('anon', 'public.profiles', 'headline', 'SELECT'), true, 'anon reads profiles.headline');
select is(has_column_privilege('anon', 'public.profiles', 'bio', 'SELECT'), true, 'anon reads profiles.bio');
select is(has_column_privilege('anon', 'public.profiles', 'location', 'SELECT'), true, 'anon reads profiles.location');

select isnt(
  has_column_privilege('anon', 'public.profiles', 'status', 'SELECT'),
  true,
  'anon cannot read profiles.status'
);
select isnt(
  has_column_privilege('authenticated', 'public.profiles', 'status', 'SELECT'),
  true,
  'authenticated cannot read profiles.status'
);
select isnt(
  has_column_privilege('authenticated', 'public.profiles', 'created_at', 'SELECT'),
  true,
  'authenticated cannot read profiles.created_at'
);

select is(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'), true, 'own display name is updatable');
select is(has_column_privilege('authenticated', 'public.profiles', 'headline', 'UPDATE'), true, 'own headline is updatable');
select is(has_column_privilege('authenticated', 'public.profiles', 'bio', 'UPDATE'), true, 'own bio is updatable');
select is(has_column_privilege('authenticated', 'public.profiles', 'location', 'UPDATE'), true, 'own location is updatable');

select isnt(
  has_column_privilege('authenticated', 'public.profiles', 'handle', 'UPDATE'),
  true,
  'handle is not client-writable'
);
select isnt(
  has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE'),
  true,
  'id is not client-writable'
);
select isnt(
  has_column_privilege('authenticated', 'public.profiles', 'status', 'UPDATE'),
  true,
  'status is not client-writable'
);

select isnt(has_table_privilege('anon', 'public.profiles', 'INSERT'), true, 'anon cannot insert profiles');
select isnt(has_table_privilege('anon', 'public.profiles', 'UPDATE'), true, 'anon cannot update profiles');
select isnt(has_table_privilege('anon', 'public.profiles', 'DELETE'), true, 'anon cannot delete profiles');
select isnt(has_table_privilege('authenticated', 'public.profiles', 'INSERT'), true, 'authenticated cannot insert profiles');
select isnt(has_table_privilege('authenticated', 'public.profiles', 'DELETE'), true, 'authenticated cannot delete profiles');

-- ---------------------------------------------------------------------------
-- Read-only catalogue tables: no client writes anywhere
-- ---------------------------------------------------------------------------

select is(has_column_privilege('anon', 'public.categories', 'slug', 'SELECT'), true, 'anon reads categories.slug');
select is(has_column_privilege('anon', 'public.categories', 'accent_hue', 'SELECT'), true, 'anon reads categories.accent_hue');
select isnt(
  has_column_privilege('anon', 'public.categories', 'status', 'SELECT'),
  true,
  'anon cannot read categories.status'
);

select is(has_column_privilege('authenticated', 'public.communities', 'slug', 'SELECT'), true, 'authenticated reads communities.slug');
select is(has_column_privilege('authenticated', 'public.communities', 'languages', 'SELECT'), true, 'authenticated reads communities.languages');
select isnt(
  has_column_privilege('authenticated', 'public.communities', 'status', 'SELECT'),
  true,
  'authenticated cannot read communities.status'
);

select isnt(has_table_privilege('authenticated', 'public.categories', 'INSERT'), true, 'authenticated cannot insert categories');
select isnt(has_table_privilege('authenticated', 'public.communities', 'INSERT'), true, 'authenticated cannot insert communities');
select isnt(has_table_privilege('authenticated', 'public.courses', 'INSERT'), true, 'authenticated cannot insert courses');
select isnt(has_table_privilege('authenticated', 'public.lessons', 'INSERT'), true, 'authenticated cannot insert lessons');
select isnt(has_table_privilege('authenticated', 'public.lesson_contents', 'INSERT'), true, 'authenticated cannot insert lesson contents');
select isnt(has_table_privilege('authenticated', 'public.lesson_resources', 'INSERT'), true, 'authenticated cannot insert lesson resources');

select isnt(has_table_privilege('anon', 'public.workspaces', 'SELECT'), true, 'anon cannot read workspaces');
select isnt(has_table_privilege('anon', 'public.workspace_memberships', 'SELECT'), true, 'anon cannot read workspace memberships');
select isnt(has_table_privilege('anon', 'public.community_memberships', 'SELECT'), true, 'anon cannot read community memberships');
select isnt(has_table_privilege('anon', 'public.course_enrollments', 'SELECT'), true, 'anon cannot read enrolments');
select isnt(has_table_privilege('anon', 'public.lesson_completions', 'SELECT'), true, 'anon cannot read completions');

select is(has_column_privilege('authenticated', 'public.workspace_memberships', 'role', 'SELECT'), true, 'authenticated reads own workspace membership columns');
select is(has_column_privilege('authenticated', 'public.community_memberships', 'status', 'SELECT'), true, 'authenticated reads own membership status');
select is(has_column_privilege('authenticated', 'public.course_enrollments', 'status', 'SELECT'), true, 'authenticated reads own enrolment status');
select is(has_column_privilege('authenticated', 'public.lesson_completions', 'completed_at', 'SELECT'), true, 'authenticated reads own completions');

select isnt(has_table_privilege('authenticated', 'public.community_memberships', 'INSERT'), true, 'memberships are command-only');
select isnt(has_table_privilege('authenticated', 'public.community_memberships', 'UPDATE'), true, 'membership updates are command-only');
select isnt(has_table_privilege('authenticated', 'public.course_enrollments', 'INSERT'), true, 'enrolments are command-only');
select isnt(has_table_privilege('authenticated', 'public.lesson_completions', 'INSERT'), true, 'completions are command-only');

-- ---------------------------------------------------------------------------
-- Private audit store
-- ---------------------------------------------------------------------------

select isnt(has_table_privilege('anon', 'private.audit_events', 'SELECT'), true, 'anon cannot read audit events');
select isnt(has_table_privilege('authenticated', 'private.audit_events', 'SELECT'), true, 'authenticated cannot read audit events');
select isnt(has_table_privilege('service_role', 'private.audit_events', 'SELECT'), true, 'service_role cannot read audit events');
select isnt(has_table_privilege('authenticated', 'private.audit_events', 'INSERT'), true, 'authenticated cannot write audit events');

-- ---------------------------------------------------------------------------
-- Function execute privileges
-- ---------------------------------------------------------------------------

select is(
  has_function_privilege('authenticated', 'public.join_community(uuid, uuid)', 'EXECUTE'),
  true,
  'authenticated may execute join_community'
);
select is(
  has_function_privilege('authenticated', 'public.leave_community(uuid, uuid)', 'EXECUTE'),
  true,
  'authenticated may execute leave_community'
);
select is(
  has_function_privilege('authenticated', 'public.enrol_in_course(uuid, uuid)', 'EXECUTE'),
  true,
  'authenticated may execute enrol_in_course'
);
select is(
  has_function_privilege('authenticated', 'public.complete_lesson(uuid, uuid)', 'EXECUTE'),
  true,
  'authenticated may execute complete_lesson'
);

select isnt(
  has_function_privilege('anon', 'public.join_community(uuid, uuid)', 'EXECUTE'),
  true,
  'anon cannot execute join_community'
);
select isnt(
  has_function_privilege('anon', 'public.enrol_in_course(uuid, uuid)', 'EXECUTE'),
  true,
  'anon cannot execute enrol_in_course'
);
select isnt(
  has_function_privilege('anon', 'public.complete_lesson(uuid, uuid)', 'EXECUTE'),
  true,
  'anon cannot execute complete_lesson'
);

select is(
  has_function_privilege('authenticated', 'private.is_active_profile()', 'EXECUTE'),
  true,
  'authenticated may execute is_active_profile'
);
select is(
  has_function_privilege('authenticated', 'private.can_access_course_content(uuid)', 'EXECUTE'),
  true,
  'authenticated may execute can_access_course_content'
);

-- No project function in public/private may grant EXECUTE to PUBLIC (grantee 0).
--
-- The scan is restricted to the functions owned by this migration set: local Supabase images may
-- install extension or platform helpers in `public`, and those are out of scope for this contract.
select is(
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.proname = any (
        array[
          'touch_updated_at', 'is_active_profile', 'handle_auth_user_created',
          'is_workspace_member', 'is_community_member', 'has_active_enrollment',
          'can_access_course_content', 'is_valid_language_tag_array',
          'join_community', 'leave_community', 'enrol_in_course', 'complete_lesson'
        ]
      )
      and (
        p.proacl is null
        or exists (
          select 1
          from aclexplode(p.proacl) a
          where a.grantee = 0 and a.privilege_type = 'EXECUTE'
        )
      )
  ),
  0::bigint,
  'no project function grants EXECUTE to PUBLIC'
);

-- Definer functions are SECURITY DEFINER with a pinned empty search_path.
select is(
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.proname in (
        'is_active_profile', 'is_workspace_member', 'is_community_member',
        'has_active_enrollment', 'can_access_course_content',
        'join_community', 'leave_community', 'enrol_in_course', 'complete_lesson',
        'handle_auth_user_created'
      )
      and (
        not p.prosecdef
        or p.proconfig is null
        or not exists (
          select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'
        )
      )
  ),
  0::bigint,
  'all definer functions are SECURITY DEFINER with a pinned search_path'
);

select * from finish();

rollback;
