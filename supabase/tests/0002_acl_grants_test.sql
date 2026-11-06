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

select has_schema_privilege('authenticated', 'private', 'USAGE', 'authenticated may use the private schema');
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

select has_column_privilege('anon', 'public.profiles', 'id', 'SELECT', 'anon reads profiles.id');
select has_column_privilege('anon', 'public.profiles', 'handle', 'SELECT', 'anon reads profiles.handle');
select has_column_privilege('anon', 'public.profiles', 'display_name', 'SELECT', 'anon reads profiles.display_name');
select has_column_privilege('anon', 'public.profiles', 'headline', 'SELECT', 'anon reads profiles.headline');
select has_column_privilege('anon', 'public.profiles', 'bio', 'SELECT', 'anon reads profiles.bio');
select has_column_privilege('anon', 'public.profiles', 'location', 'SELECT', 'anon reads profiles.location');

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

select has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE', 'own display name is updatable');
select has_column_privilege('authenticated', 'public.profiles', 'headline', 'UPDATE', 'own headline is updatable');
select has_column_privilege('authenticated', 'public.profiles', 'bio', 'UPDATE', 'own bio is updatable');
select has_column_privilege('authenticated', 'public.profiles', 'location', 'UPDATE', 'own location is updatable');

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

select has_column_privilege('anon', 'public.categories', 'slug', 'SELECT', 'anon reads categories.slug');
select has_column_privilege('anon', 'public.categories', 'accent_hue', 'SELECT', 'anon reads categories.accent_hue');
select isnt(
  has_column_privilege('anon', 'public.categories', 'status', 'SELECT'),
  true,
  'anon cannot read categories.status'
);

select has_column_privilege('authenticated', 'public.communities', 'slug', 'SELECT', 'authenticated reads communities.slug');
select has_column_privilege('authenticated', 'public.communities', 'languages', 'SELECT', 'authenticated reads communities.languages');
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

select has_column_privilege('authenticated', 'public.workspace_memberships', 'role', 'SELECT', 'authenticated reads own workspace membership columns');
select has_column_privilege('authenticated', 'public.community_memberships', 'status', 'SELECT', 'authenticated reads own membership status');
select has_column_privilege('authenticated', 'public.course_enrollments', 'status', 'SELECT', 'authenticated reads own enrolment status');
select has_column_privilege('authenticated', 'public.lesson_completions', 'completed_at', 'SELECT', 'authenticated reads own completions');

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

select has_function_privilege(
  'authenticated',
  'public.join_community(uuid, uuid)',
  'EXECUTE',
  'authenticated may execute join_community'
);
select has_function_privilege(
  'authenticated',
  'public.leave_community(uuid, uuid)',
  'EXECUTE',
  'authenticated may execute leave_community'
);
select has_function_privilege(
  'authenticated',
  'public.enrol_in_course(uuid, uuid)',
  'EXECUTE',
  'authenticated may execute enrol_in_course'
);
select has_function_privilege(
  'authenticated',
  'public.complete_lesson(uuid, uuid)',
  'EXECUTE',
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

select has_function_privilege(
  'authenticated',
  'private.is_active_profile()',
  'EXECUTE',
  'authenticated may execute is_active_profile'
);
select has_function_privilege(
  'authenticated',
  'private.can_access_course_content(uuid)',
  'EXECUTE',
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
