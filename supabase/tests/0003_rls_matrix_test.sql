-- Phase 3A Wave 1 — RLS access matrix tests.
-- Contract: docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md §6 and §9.
--
-- Run with: supabase test db --local

begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select no_plan();

-- Test-only identities. They exist for this transaction only and are rolled back.
insert into auth.users (
  id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data
)
values
  (
    'f0000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'learner.one@test.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"learnerone","display_name":"Learner One"}'::jsonb
  ),
  (
    'f0000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'learner.two@test.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"learnertwo","display_name":"Learner Two"}'::jsonb
  ),
  (
    'f0000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'paused.member@test.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"pausedmember","display_name":"Paused Member"}'::jsonb
  ),
  (
    'f0000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'banned.member@test.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"bannedmember","display_name":"Banned Member"}'::jsonb
  ),
  (
    'f0000000-0000-4000-8000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'suspended.profile@test.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"suspendedprofile","display_name":"Suspended Profile"}'::jsonb
  );

-- Extra catalogue rows used by the matrix without changing the committed happy-path seed.
insert into public.communities (
  id, workspace_id, slug, name, tagline, description, privacy, join_policy,
  discoverability, status, accent_hue, languages, published_at
)
values (
  '40000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000001',
  'quiet-lab', 'Quiet Lab',
  'An unlisted community used to prove discovery concealment.',
  'This community is published but unlisted, so only active members and named workspace managers may read it.',
  'public', 'open', 'unlisted', 'published', 190, array['en'],
  timestamptz '2026-01-08T10:00:00Z'
);

insert into public.courses (
  id, workspace_id, community_id, category_id, instructor_id, slug, title,
  subtitle, description, level, access, status
)
values (
  '50000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'draft-course', 'Draft Course', 'A draft only managers may see.',
  'Used to prove that draft curriculum is not readable merely through community membership.',
  'beginner', 'included', 'draft'
);

insert into public.community_memberships (community_id, user_id, role, status, joined_at)
values
  ('40000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000003', 'member', 'paused', timestamptz '2026-01-09T09:00:00Z'),
  ('40000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000004', 'member', 'banned', timestamptz '2026-01-09T09:00:00Z'),
  ('40000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000005', 'member', 'active', timestamptz '2026-01-09T09:00:00Z');

insert into public.course_enrollments (course_id, user_id, status, source)
values
  ('50000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000003', 'active', 'seed'),
  ('50000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000004', 'active', 'seed'),
  ('50000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000005', 'active', 'seed');

update public.profiles set status = 'suspended'
where id = 'f0000000-0000-4000-8000-000000000005';

-- ---------------------------------------------------------------------------
-- Anonymous visibility
-- ---------------------------------------------------------------------------

set local role anon;

select is((select count(*) from public.categories), 5::bigint, 'anon sees all five active categories');
select is((select count(*) from public.communities), 2::bigint, 'anon sees only listed published communities');
select is((select count(*) from public.courses), 2::bigint, 'anon sees courses of listed published communities');
select is((select count(*) from public.lessons), 7::bigint, 'anon sees the outlines of visible courses');
select is((select count(*) from public.lesson_contents), 2::bigint, 'anon sees preview content only');
select is((select count(*) from public.lesson_resources), 2::bigint, 'anon sees preview resources only');
select is(
  (select count(*) from public.profiles where id in (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003'
  )),
  3::bigint,
  'anon sees active catalogue profiles'
);
select is(
  (select count(*) from public.profiles where id = 'f0000000-0000-4000-8000-000000000005'),
  0::bigint,
  'anon cannot see a suspended profile'
);

reset role;

-- ---------------------------------------------------------------------------
-- Signed-in stranger
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is((select count(*) from public.communities), 2::bigint, 'stranger sees listed community metadata but not the unlisted community');
select is((select count(*) from public.community_categories), 3::bigint, 'stranger sees category links only for visible communities');
select is((select count(*) from public.courses), 2::bigint, 'stranger does not see the draft course');
select is((select count(*) from public.community_memberships), 0::bigint, 'stranger has no visible memberships');
select is((select count(*) from public.course_enrollments), 0::bigint, 'stranger has no visible enrolments');
select is((select count(*) from public.lesson_completions), 0::bigint, 'stranger has no visible completions');
select is((select count(*) from public.lesson_contents), 2::bigint, 'stranger sees preview content only');
select is((select count(*) from public.lesson_resources), 2::bigint, 'stranger sees preview resources only');

-- Concealed denial for private/invite and unlisted communities.
select is(
  (select public.join_community('40000000-0000-4000-8000-000000000002', gen_random_uuid()) ->> 'code'),
  'not_found',
  'direct join of the private invite community is concealed as not_found'
);
select is(
  (select public.join_community('40000000-0000-4000-8000-000000000003', gen_random_uuid()) ->> 'code'),
  'not_found',
  'direct join of the unlisted community is concealed as not_found'
);
select is(
  (select public.join_community('00000000-0000-4000-8000-0000000000ff', gen_random_uuid()) ->> 'code'),
  'not_found',
  'join of a missing community returns the same concealed shape'
);

-- Happy path join.
select is(
  (select public.join_community('40000000-0000-4000-8000-000000000001', gen_random_uuid()) ->> 'ok'),
  'true',
  'stranger can join the public open community'
);
select is((select count(*) from public.community_memberships), 1::bigint, 'own membership becomes visible after join');
select is(
  (select public.join_community('40000000-0000-4000-8000-000000000001', gen_random_uuid()) ->> 'changed'),
  'false',
  'a second join is an idempotent no-op'
);

-- Enrolment and protected content.
select is((select count(*) from public.lesson_contents), 2::bigint, 'membership alone does not unlock protected content');
select is(
  (select public.enrol_in_course('50000000-0000-4000-8000-000000000001', gen_random_uuid()) ->> 'ok'),
  'true',
  'eligible learner can enrol in a public course'
);
select is((select count(*) from public.course_enrollments), 1::bigint, 'own enrolment becomes visible after enrol');
select is((select count(*) from public.lesson_contents), 5::bigint, 'membership plus enrolment unlocks this course only');
select is((select count(*) from public.lesson_resources), 3::bigint, 'protected resources unlock for this course only');

select is(
  (select public.complete_lesson('80000000-0000-4000-8000-000000000002', gen_random_uuid()) ->> 'learningStatus'),
  'in-progress',
  'completing one of four lessons reports in-progress'
);
select is((select count(*) from public.lesson_completions), 1::bigint, 'own completion is visible');

reset role;

-- ---------------------------------------------------------------------------
-- Cross-user isolation
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is((select count(*) from public.community_memberships), 0::bigint, 'learner two cannot see learner one membership');
select is((select count(*) from public.course_enrollments), 0::bigint, 'learner two cannot see learner one enrolment');
select is((select count(*) from public.lesson_completions), 0::bigint, 'learner two cannot see learner one completion');
select is((select count(*) from public.course_enrollments), 0::bigint, 'learner two cannot see learner one history');
update public.profiles
set display_name = 'Compromised'
where id = 'f0000000-0000-4000-8000-000000000001';

reset role;

select is(
  (select display_name from public.profiles where id = 'f0000000-0000-4000-8000-000000000001'),
  'Learner One',
  'learner two cannot update learner one profile'
);

-- ---------------------------------------------------------------------------
-- Membership loss revokes protected content but preserves history
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select public.leave_community('40000000-0000-4000-8000-000000000001', gen_random_uuid()) ->> 'changed'),
  'true',
  'active member can leave'
);
select is((select count(*) from public.lesson_contents), 2::bigint, 'leaving revokes protected content immediately');
select is(
  (select public.complete_lesson('80000000-0000-4000-8000-000000000003', gen_random_uuid()) ->> 'code'),
  'forbidden',
  'leaving blocks new completion'
);
select is((select count(*) from public.course_enrollments), 1::bigint, 'own enrolment history remains readable after leaving');
select is((select count(*) from public.lesson_completions), 1::bigint, 'own completion history remains readable after leaving');

select is(
  (select public.join_community('40000000-0000-4000-8000-000000000001', gen_random_uuid()) ->> 'changed'),
  'true',
  'left member can rejoin the public open community'
);
select is((select count(*) from public.lesson_contents), 5::bigint, 'rejoining restores protected content');
select is(
  (select public.complete_lesson('80000000-0000-4000-8000-000000000003', gen_random_uuid()) ->> 'ok'),
  'true',
  'rejoining restores new completion access'
);

reset role;

-- ---------------------------------------------------------------------------
-- Paused, banned, and suspended principals are not active
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000003","role":"authenticated"}';

select is((select private.is_active_profile()), true, 'paused membership still belongs to an active profile');
select is((select count(*) from public.lesson_contents), 2::bigint, 'paused membership cannot read protected content');
select is(
  (select public.complete_lesson('80000000-0000-4000-8000-000000000002', gen_random_uuid()) ->> 'code'),
  'forbidden',
  'paused membership cannot create a new completion'
);

reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000004","role":"authenticated"}';

select is((select count(*) from public.lesson_contents), 2::bigint, 'banned membership cannot read protected content');
select is(
  (select public.complete_lesson('80000000-0000-4000-8000-000000000002', gen_random_uuid()) ->> 'code'),
  'forbidden',
  'banned membership cannot create a new completion'
);

reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000005","role":"authenticated"}';

select is((select private.is_active_profile()), false, 'suspended profile is not active');
select is((select count(*) from public.lesson_contents), 2::bigint, 'suspended profile cannot read protected content');
select is(
  (select public.complete_lesson('80000000-0000-4000-8000-000000000002', gen_random_uuid()) ->> 'code'),
  'not_authenticated',
  'suspended profile cannot complete a lesson'
);
update public.profiles
set display_name = 'Should Not Change'
where id = 'f0000000-0000-4000-8000-000000000005';

reset role;

select is(
  (select display_name from public.profiles where id = 'f0000000-0000-4000-8000-000000000005'),
  'Suspended Profile',
  'suspended profile cannot update itself'
);

-- ---------------------------------------------------------------------------
-- Workspace manager scope
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is(
  (select count(*) from public.courses where id = '50000000-0000-4000-8000-000000000003'),
  0::bigint,
  'a stranger does not see draft curriculum'
);

reset role;

insert into public.workspace_memberships (workspace_id, user_id, role, status)
values (
  '20000000-0000-4000-8000-000000000001',
  'f0000000-0000-4000-8000-000000000002',
  'editor',
  'active'
);

-- Draft community plus a published course inside it. An active community member must still not see
-- either row; only a named active workspace manager receives draft scope (contract §6).
insert into public.communities (
  id, workspace_id, slug, name, tagline, description, privacy, join_policy,
  discoverability, status, accent_hue, languages
)
values (
  '40000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000001',
  'draft-lab', 'Draft Lab',
  'A draft community visible only to named workspace managers.',
  'This community is not published; even an active member must not see it or its published course.',
  'public', 'open', 'listed', 'draft', 200, array['en']
);

insert into public.courses (
  id, workspace_id, community_id, category_id, instructor_id, slug, title,
  subtitle, description, level, access, status, published_at
)
values (
  '50000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000004',
  '30000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'draft-lab-course', 'Draft Lab Course',
  'A published course inside an unpublished community.',
  'Used to prove community status gates the course outline even for an active member.',
  'beginner', 'included', 'published', timestamptz '2026-01-08T11:00:00Z'
);

insert into public.community_memberships (community_id, user_id, role, status, joined_at)
values (
  '40000000-0000-4000-8000-000000000004',
  'f0000000-0000-4000-8000-000000000001',
  'member', 'active', timestamptz '2026-01-09T09:00:00Z'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select count(*) from public.communities where id = '40000000-0000-4000-8000-000000000004'),
  0::bigint,
  'active membership does not expose a draft community'
);
select is(
  (select count(*) from public.courses where community_id = '40000000-0000-4000-8000-000000000004'),
  0::bigint,
  'active membership does not expose curriculum in a draft community'
);

reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is(
  (select count(*) from public.courses where status = 'draft'),
  1::bigint,
  'an active editor sees draft curriculum in their workspace'
);
select is(
  (select count(*) from public.communities where slug = 'quiet-lab'),
  1::bigint,
  'an active editor sees unlisted community metadata in their workspace'
);
select is(
  (select count(*) from public.communities where id = '40000000-0000-4000-8000-000000000004'),
  1::bigint,
  'an active editor sees the draft community'
);
select is(
  (select count(*) from public.courses where community_id = '40000000-0000-4000-8000-000000000004'),
  1::bigint,
  'an active editor sees curriculum in the draft community'
);

reset role;

insert into public.workspace_memberships (workspace_id, user_id, role, status)
values (
  '20000000-0000-4000-8000-000000000001',
  'f0000000-0000-4000-8000-000000000001',
  'viewer',
  'active'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select count(*) from public.courses where status = 'draft'),
  0::bigint,
  'a workspace viewer does not receive draft access'
);

reset role;

select * from finish();

rollback;
