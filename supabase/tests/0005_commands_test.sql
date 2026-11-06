-- Phase 3A Wave 1 — caller-bound command state machine and audit tests.
-- Contract: docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md §5.2 and §9.
--
-- Run with: supabase test db --local

begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select no_plan();

-- Test-only identities, rolled back with the transaction.
insert into auth.users (
  id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data
)
values
  (
    'f2000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'command.learner@test.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"commandlearner","display_name":"Command Learner"}'::jsonb
  ),
  (
    'f2000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'command.other@test.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"commandother","display_name":"Command Other"}'::jsonb
  ),
  (
    'f2000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'command.suspended@test.invalid',
    '{"provider":"seed","providers":["seed"]}'::jsonb,
    '{"handle":"commandsuspended","display_name":"Command Suspended"}'::jsonb
  );

update public.profiles set status = 'suspended'
where id = 'f2000000-0000-4000-8000-000000000003';

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

-- ---------------------------------------------------------------------------
-- Request ID is mandatory before mutation
-- ---------------------------------------------------------------------------

select throws_ok(
  $sql$ select public.join_community('40000000-0000-4000-8000-000000000001', null) $sql$,
  '22023',
  'request_id_required',
  'join_community rejects a null request id'
);

select throws_ok(
  $sql$ select public.leave_community('40000000-0000-4000-8000-000000000001', null) $sql$,
  '22023',
  'request_id_required',
  'leave_community rejects a null request id'
);

select throws_ok(
  $sql$ select public.enrol_in_course('50000000-0000-4000-8000-000000000001', null) $sql$,
  '22023',
  'request_id_required',
  'enrol_in_course rejects a null request id'
);

select throws_ok(
  $sql$ select public.complete_lesson('80000000-0000-4000-8000-000000000002', null) $sql$,
  '22023',
  'request_id_required',
  'complete_lesson rejects a null request id'
);

reset role;

select is(
  (select count(*) from private.audit_events),
  0::bigint,
  'rejected null request ids create no audit event'
);

-- ---------------------------------------------------------------------------
-- Join / leave / rejoin state machine
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select public.join_community('00000000-0000-4000-8000-0000000000ff', gen_random_uuid()) ->> 'code'),
  'not_found',
  'join of a missing community is concealed'
);
select is(
  (select public.join_community('40000000-0000-4000-8000-000000000002', gen_random_uuid()) ->> 'code'),
  'not_found',
  'join of the private invite community is concealed'
);

select is(
  (
    select public.join_community(
      '40000000-0000-4000-8000-000000000001',
      '7a000000-0000-4000-8000-000000000001'
    ) ->> 'changed'
  ),
  'true',
  'absent member joins with one transition'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000001'
      and action = 'community.joined'
      and target_id = '40000000-0000-4000-8000-000000000001'
      and request_id = '7a000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'the winning join writes exactly one audit event'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (
    select public.join_community(
      '40000000-0000-4000-8000-000000000001',
      '7a000000-0000-4000-8000-000000000002'
    ) ->> 'changed'
  ),
  'false',
  'an active member join is an idempotent no-op'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000001'
      and action = 'community.joined'
  ),
  1::bigint,
  'the idempotent no-op does not audit'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (
    select public.leave_community(
      '40000000-0000-4000-8000-000000000001',
      '7a000000-0000-4000-8000-000000000003'
    ) ->> 'changed'
  ),
  'true',
  'active member leaves with one transition'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000001'
      and action = 'community.left'
  ),
  1::bigint,
  'the winning leave writes exactly one audit event'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (
    select public.leave_community(
      '40000000-0000-4000-8000-000000000001',
      '7a000000-0000-4000-8000-000000000004'
    ) ->> 'changed'
  ),
  'false',
  'a second leave is an idempotent no-op'
);
select is(
  (
    select public.leave_community(
      '40000000-0000-4000-8000-000000000001',
      '7a000000-0000-4000-8000-000000000005'
    ) ->> 'membershipState'
  ),
  'not-member',
  'leave reports not-member for an absent membership'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000001'
      and action = 'community.left'
  ),
  1::bigint,
  'the idempotent leave does not audit'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (
    select public.join_community(
      '40000000-0000-4000-8000-000000000001',
      '7a000000-0000-4000-8000-000000000006'
    ) ->> 'changed'
  ),
  'true',
  'left member can rejoin with one transition'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000001'
      and action = 'community.joined'
  ),
  2::bigint,
  'rejoin writes a second join audit event'
);

-- ---------------------------------------------------------------------------
-- Enrolment state machine
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (
    select public.enrol_in_course(
      '00000000-0000-4000-8000-0000000000ff',
      gen_random_uuid()
    ) ->> 'code'
  ),
  'not_found',
  'enrolment in a missing course is concealed'
);
select is(
  (
    select public.enrol_in_course(
      '50000000-0000-4000-8000-000000000001',
      '7b000000-0000-4000-8000-000000000001'
    ) ->> 'changed'
  ),
  'true',
  'eligible learner enrols with one transition'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000001'
      and action = 'course.enrolled'
  ),
  1::bigint,
  'the winning enrolment writes exactly one audit event'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (
    select public.enrol_in_course(
      '50000000-0000-4000-8000-000000000001',
      '7b000000-0000-4000-8000-000000000002'
    ) ->> 'changed'
  ),
  'false',
  'a second enrolment is an idempotent no-op'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000001'
      and action = 'course.enrolled'
  ),
  1::bigint,
  'the idempotent enrolment does not audit'
);

-- A cancelled enrolment is not silently reactivated in this slice.
update public.course_enrollments
set status = 'cancelled'
where course_id = '50000000-0000-4000-8000-000000000001'
  and user_id = 'f2000000-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (
    select public.enrol_in_course(
      '50000000-0000-4000-8000-000000000001',
      '7b000000-0000-4000-8000-000000000003'
    ) ->> 'status'
  ),
  'cancelled',
  'a cancelled enrolment is returned unchanged'
);

reset role;

update public.course_enrollments
set status = 'active'
where course_id = '50000000-0000-4000-8000-000000000001'
  and user_id = 'f2000000-0000-4000-8000-000000000001';

-- ---------------------------------------------------------------------------
-- Completion state machine and progress
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (
    select public.complete_lesson(
      '80000000-0000-4000-8000-000000000002',
      '7c000000-0000-4000-8000-000000000001'
    ) ->> 'learningStatus'
  ),
  'in-progress',
  'first completion reports in-progress'
);
select is(
  (
    select public.complete_lesson(
      '80000000-0000-4000-8000-000000000002',
      '7c000000-0000-4000-8000-000000000002'
    ) ->> 'changed'
  ),
  'false',
  'a duplicate completion is an idempotent no-op'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000001'
      and action = 'lesson.completed'
  ),
  1::bigint,
  'the winning completion writes exactly one audit event'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (
    select public.complete_lesson(
      '80000000-0000-4000-8000-000000000001',
      '7c000000-0000-4000-8000-000000000003'
    ) ->> 'completedLessons'
  ),
  '2',
  'completed lesson count advances'
);

select is(
  (
    select public.complete_lesson(
      '80000000-0000-4000-8000-000000000003',
      '7c000000-0000-4000-8000-000000000004'
    ) ->> 'progressPercent'
  ),
  '75',
  'three of four lessons reports seventy-five percent'
);

select is(
  (
    select public.complete_lesson(
      '80000000-0000-4000-8000-000000000004',
      '7c000000-0000-4000-8000-000000000005'
    ) ->> 'learningStatus'
  ),
  'completed',
  'all lessons reports completed'
);

select is(
  (
    select public.complete_lesson(
      '80000000-0000-4000-8000-000000000005',
      '7c000000-0000-4000-8000-000000000006'
    ) ->> 'code'
  ),
  'forbidden',
  'a learner cannot complete a lesson in another community course'
);

select is(
  (
    select public.complete_lesson(
      '00000000-0000-4000-8000-0000000000ff',
      '7c000000-0000-4000-8000-000000000007'
    ) ->> 'code'
  ),
  'not_found',
  'a missing lesson is concealed'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000001'
      and action = 'lesson.completed'
  ),
  4::bigint,
  'four distinct completions produce four audit events'
);

-- ---------------------------------------------------------------------------
-- Enrolment without membership cannot read or complete protected content
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is(
  (
    select public.enrol_in_course(
      '50000000-0000-4000-8000-000000000001',
      '7d000000-0000-4000-8000-000000000001'
    ) ->> 'changed'
  ),
  'true',
  'a public course is open to enrolment without membership'
);
select is((select count(*) from public.lesson_contents), 2::bigint, 'enrolment without membership still sees previews only');
select is(
  (
    select public.complete_lesson(
      '80000000-0000-4000-8000-000000000002',
      '7d000000-0000-4000-8000-000000000002'
    ) ->> 'code'
  ),
  'forbidden',
  'enrolment without membership cannot complete a protected lesson'
);

reset role;

-- ---------------------------------------------------------------------------
-- Suspended principal
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000003","role":"authenticated"}';

select is(
  (
    select public.join_community(
      '40000000-0000-4000-8000-000000000001',
      '7e000000-0000-4000-8000-000000000001'
    ) ->> 'code'
  ),
  'not_authenticated',
  'a suspended profile cannot join'
);
select is(
  (
    select public.enrol_in_course(
      '50000000-0000-4000-8000-000000000001',
      '7e000000-0000-4000-8000-000000000002'
    ) ->> 'code'
  ),
  'not_authenticated',
  'a suspended profile cannot enrol'
);
select is(
  (
    select public.complete_lesson(
      '80000000-0000-4000-8000-000000000002',
      '7e000000-0000-4000-8000-000000000003'
    ) ->> 'code'
  ),
  'not_authenticated',
  'a suspended profile cannot complete'
);

reset role;

select is(
  (
    select count(*)
    from private.audit_events
    where actor_id = 'f2000000-0000-4000-8000-000000000003'
  ),
  0::bigint,
  'a suspended principal produces no audit events'
);

select * from finish();

rollback;
