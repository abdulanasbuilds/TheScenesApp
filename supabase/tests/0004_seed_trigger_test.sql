-- Phase 3A Wave 1 — deterministic seed and hardened Auth trigger tests.
-- Contract: docs/PHASE-3-DATA-AUTHORIZATION-CONTRACT.md §3.1, §4, §5.1, and §9.
--
-- Run with: supabase test db --local

begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select no_plan();

-- ---------------------------------------------------------------------------
-- Catalogue actors: no login capability
-- ---------------------------------------------------------------------------

select is(
  (
    select count(*)
    from auth.users
    where id in (
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000003'
    )
  ),
  3::bigint,
  'the seed creates exactly three catalogue Auth rows'
);

select is(
  (
    select count(*)
    from auth.users
    where id in (
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000003'
    )
      and encrypted_password is null
  ),
  3::bigint,
  'catalogue actors have no password hash'
);

select is(
  (
    select count(*)
    from auth.identities
    where user_id in (
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000003'
    )
  ),
  0::bigint,
  'catalogue actors have no identity row'
);

select is(
  (
    select count(*)
    from auth.sessions
    where user_id in (
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000003'
    )
  ),
  0::bigint,
  'catalogue actors have no session'
);

select is(
  (
    select count(*)
    from auth.users
    where id in (
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000003'
    )
      and email like '%.invalid'
  ),
  3::bigint,
  'catalogue actors use reserved .invalid addresses'
);

select is(
  (
    select count(*)
    from public.profiles
    where handle in ('nadiaokafor', 'kwamemensah', 'selaadjei')
      and status = 'active'
  ),
  3::bigint,
  'the trigger produced one active profile per catalogue actor'
);

select is(
  (
    select array_agg(created_at order by handle)
    from public.profiles
    where handle in ('kwamemensah', 'nadiaokafor', 'selaadjei')
  ),
  array[
    timestamptz '2026-01-05T09:00:00Z',
    timestamptz '2026-01-05T09:00:00Z',
    timestamptz '2026-01-05T09:00:00Z'
  ],
  'seeded profile timestamps are fixed'
);

-- ---------------------------------------------------------------------------
-- Seed catalogue content
-- ---------------------------------------------------------------------------

select is((select count(*) from public.categories where status = 'active'), 5::bigint, 'five active categories are seeded');
select is((select count(*) from public.communities), 2::bigint, 'two communities are seeded');
select is((select count(*) from public.courses), 2::bigint, 'two published courses are seeded');
select is((select count(*) from public.lessons), 7::bigint, 'seven lessons are seeded');
select is((select count(*) from public.lesson_contents), 7::bigint, 'every seeded lesson has content');
select is((select count(*) from public.lesson_resources), 4::bigint, 'four bounded resources are seeded');

select is(
  (select privacy from public.communities where slug = 'product-design-studio'),
  'public',
  'Product Design Studio is the public happy path'
);
select is(
  (select join_policy from public.communities where slug = 'product-design-studio'),
  'open',
  'Product Design Studio is open to join'
);
select is(
  (select privacy from public.communities where slug = 'ai-builders-guild'),
  'private',
  'AI Builders Guild is private'
);
select is(
  (select join_policy from public.communities where slug = 'ai-builders-guild'),
  'invite',
  'AI Builders Guild is invite-only'
);

select is(
  (
    select count(*)
    from public.lessons
    where course_id = '50000000-0000-4000-8000-000000000001'
      and is_preview
  ),
  1::bigint,
  'the public happy-path course exposes exactly one preview lesson'
);

select is(
  (
    select array_agg(position order by position)
    from public.course_modules
    where course_id = '50000000-0000-4000-8000-000000000001'
  ),
  array[1, 2]::smallint[],
  'module positions are deterministic'
);

-- ---------------------------------------------------------------------------
-- Hardened Auth trigger
-- ---------------------------------------------------------------------------

insert into auth.users (
  id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data
)
values (
  'f1000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'fresh.user@test.invalid',
  '{"provider":"seed","providers":["seed"]}'::jsonb,
  '{"handle":"freshuser","display_name":"Fresh User"}'::jsonb
);

select is(
  (
    select handle
    from public.profiles
    where id = 'f1000000-0000-4000-8000-000000000001'
  ),
  'freshuser',
  'a valid signup creates exactly one profile through the trigger'
);

select is(
  (
    select display_name
    from public.profiles
    where id = 'f1000000-0000-4000-8000-000000000001'
  ),
  'Fresh User',
  'the trigger copies the display name'
);

select throws_ok(
  $sql$ insert into auth.users (
          id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data
        )
        values (
          'f1000000-0000-4000-8000-000000000002',
          '00000000-0000-0000-0000-000000000000',
          'authenticated', 'authenticated', 'privileged.key@test.invalid',
          '{"provider":"seed","providers":["seed"]}'::jsonb,
          '{"handle":"privilegedkey","display_name":"Privileged Key","status":"active"}'::jsonb
        ) $sql$,
  '22023',
  'profile_metadata_rejected',
  'privileged metadata keys are rejected'
);

select throws_ok(
  $sql$ insert into auth.users (
          id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data
        )
        values (
          'f1000000-0000-4000-8000-000000000003',
          '00000000-0000-0000-0000-000000000000',
          'authenticated', 'authenticated', 'bad.handle@test.invalid',
          '{"provider":"seed","providers":["seed"]}'::jsonb,
          '{"handle":"Bad Handle","display_name":"Bad Handle"}'::jsonb
        ) $sql$,
  '22023',
  'invalid_handle',
  'malformed handles are rejected'
);

select throws_ok(
  $sql$ insert into auth.users (
          id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data
        )
        values (
          'f1000000-0000-4000-8000-000000000004',
          '00000000-0000-0000-0000-000000000000',
          'authenticated', 'authenticated', 'missing.handle@test.invalid',
          '{"provider":"seed","providers":["seed"]}'::jsonb,
          '{"display_name":"Missing Handle"}'::jsonb
        ) $sql$,
  '22023',
  'invalid_handle',
  'missing handles are rejected'
);

select throws_ok(
  $sql$ insert into auth.users (
          id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data
        )
        values (
          'f1000000-0000-4000-8000-000000000005',
          '00000000-0000-0000-0000-000000000000',
          'authenticated', 'authenticated', 'short.name@test.invalid',
          '{"provider":"seed","providers":["seed"]}'::jsonb,
          '{"handle":"shortname","display_name":"x"}'::jsonb
        ) $sql$,
  '22023',
  'invalid_display_name',
  'short display names are rejected'
);

select throws_ok(
  $sql$ insert into auth.users (
          id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data
        )
        values (
          'f1000000-0000-4000-8000-000000000006',
          '00000000-0000-0000-0000-000000000000',
          'authenticated', 'authenticated', 'duplicate.handle@test.invalid',
          '{"provider":"seed","providers":["seed"]}'::jsonb,
          '{"handle":"nadiaokafor","display_name":"Duplicate Handle"}'::jsonb
        ) $sql$,
  '23505',
  'duplicate handles are rejected'
);

select is(
  (
    select count(*)
    from auth.users
    where email = 'duplicate.handle@test.invalid'
  ),
  0::bigint,
  'a rejected duplicate handle rolls the Auth insert back atomically'
);

select is(
  (
    select count(*)
    from public.profiles
    where handle = 'nadiaokafor'
  ),
  1::bigint,
  'the rejected duplicate did not create a second profile'
);

select * from finish();

rollback;
