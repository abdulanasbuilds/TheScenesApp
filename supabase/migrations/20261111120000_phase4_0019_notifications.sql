-- Phase 4 slice P4-S3 - 0019: connected notifications and preferences.
--
-- Contract: docs/PHASE-4-PLAN.md section 4. Owner-only rows, column-scoped client access, no client
-- insert on notifications, and one atomic trigger that maps the existing caller-bound audit
-- transitions to notifications inside the same transaction as the state change.
--
-- This migration is additive. It is authored and locally reviewed here; applying it to a hosted
-- environment is a separate, explicitly approved action.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_values
    check (type in ('community_joined', 'course_enrolled', 'lesson_completed', 'system')),
  constraint notifications_title_len check (char_length(btrim(title)) between 1 and 120),
  constraint notifications_body_len check (char_length(btrim(body)) between 1 and 500),
  constraint notifications_dedupe_key_len check (char_length(dedupe_key) between 1 and 160),
  -- Safe internal relative paths only. A notification can never become an open redirect or an
  -- absolute URL, and it can only point at approved route families.
  constraint notifications_href_format check (
    href is null
    or (
      char_length(href) <= 200
      and href ~ '^/(?:home|my-learning|notifications|settings|c/[a-z0-9]+(?:-[a-z0-9]+)*(?:/classroom/[a-z0-9]+(?:-[a-z0-9]+)*)?)$'
    )
  )
);

create unique index notifications_user_dedupe_key
  on public.notifications (user_id, dedupe_key);

create index notifications_user_keyset_idx
  on public.notifications (user_id, created_at desc, id desc);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

-- No client insert/delete. Reads are owned; the only writable column is `read_at`.
revoke all on table public.notifications from anon, authenticated;
grant select (id, user_id, type, title, body, href, read_at, created_at)
  on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy notifications_select_own on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy notifications_update_own on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Explicit channel/category preferences. No opaque settings JSON. Account and security messages are
-- mandatory in-app and are therefore not representable here. Email and push delivery are deferred;
-- their columns exist so a preference can be stored before a delivery provider is approved, and they
-- default to off (opt-in).
create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  in_app_learning boolean not null default true,
  in_app_community boolean not null default true,
  in_app_product boolean not null default true,
  email_learning boolean not null default false,
  email_community boolean not null default false,
  email_product boolean not null default false,
  push_learning boolean not null default false,
  push_community boolean not null default false,
  push_product boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_touch_updated_at
  before update on public.notification_preferences
  for each row execute function private.touch_updated_at();

alter table public.notification_preferences enable row level security;

revoke all on table public.notification_preferences from anon, authenticated;
grant select (
  user_id, in_app_learning, in_app_community, in_app_product,
  email_learning, email_community, email_product,
  push_learning, push_community, push_product, updated_at
) on public.notification_preferences to authenticated;
grant insert (
  user_id, in_app_learning, in_app_community, in_app_product,
  email_learning, email_community, email_product,
  push_learning, push_community, push_product
) on public.notification_preferences to authenticated;
grant update (
  in_app_learning, in_app_community, in_app_product,
  email_learning, email_community, email_product,
  push_learning, push_community, push_product
) on public.notification_preferences to authenticated;

create policy notification_preferences_select_own on public.notification_preferences
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy notification_preferences_insert_own on public.notification_preferences
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy notification_preferences_update_own on public.notification_preferences
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- One notification per real caller-bound transition, created atomically with the transition. The
-- audit event is written only by the command functions, and each event has a unique id, so the
-- dedupe key makes repeated or replayed inserts a no-op.
--
-- Initial event matrix (docs/PHASE-4-PLAN.md section 4): community.joined and course.enrolled emit
-- notifications. lesson.completed stays default-off to avoid noise, and `system` is reserved for a
-- privileged, audited server path that does not flow through caller-bound learning transitions.
create or replace function private.create_notification_from_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := new.actor_id;
  v_type text;
  v_title text;
  v_body text;
  v_href text;
  v_enabled boolean;
  v_name text;
  v_community_slug text;
  v_course_slug text;
begin
  if v_user is null then
    return new;
  end if;

  if new.action = 'community.joined' then
    select c.name, c.slug into v_name, v_community_slug
    from public.communities c
    where c.id = new.target_id;

    if v_name is null then
      return new;
    end if;

    select coalesce(p.in_app_community, true) into v_enabled
    from public.notification_preferences p
    where p.user_id = v_user;

    v_type := 'community_joined';
    v_title := left('You joined ' || v_name, 120);
    v_body := 'Your membership is active. Open the community to see what is new.';
    v_href := '/c/' || v_community_slug;

  elsif new.action = 'course.enrolled' then
    select c.title, com.slug, c.slug into v_name, v_community_slug, v_course_slug
    from public.courses c
    join public.communities com on com.id = c.community_id
    where c.id = new.target_id;

    if v_name is null then
      return new;
    end if;

    select coalesce(p.in_app_learning, true) into v_enabled
    from public.notification_preferences p
    where p.user_id = v_user;

    v_type := 'course_enrolled';
    v_title := left('You enrolled in ' || v_name, 120);
    v_body := 'Your lessons are ready. Continue where you left off.';
    v_href := '/c/' || v_community_slug || '/classroom/' || v_course_slug;

  else
    return new;
  end if;

  -- Absent preference row means the safe default (in-app on).
  if coalesce(v_enabled, true) is not true then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, href, dedupe_key)
  values (v_user, v_type, v_title, v_body, v_href, 'audit:' || new.id::text)
  on conflict (user_id, dedupe_key) do nothing;

  return new;
end;
$$;

revoke all on function private.create_notification_from_audit_event() from public;

create trigger audit_events_create_notification
  after insert on private.audit_events
  for each row execute function private.create_notification_from_audit_event();
