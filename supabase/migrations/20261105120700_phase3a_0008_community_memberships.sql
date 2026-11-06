-- Phase 3A Wave 1 — 0008: community memberships.
--
-- Contract: §3.7, §6. Table has no client write privilege; all mutations flow through the
-- caller-bound command functions.

create table public.community_memberships (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  role text not null default 'member',
  status text not null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_memberships_role_values check (role in ('member', 'moderator', 'manager')),
  constraint community_memberships_status_values
    check (status in ('active', 'invited', 'paused', 'banned', 'left')),
  constraint community_memberships_joined_at_agrees
    check (status = 'invited' or joined_at is not null)
);

create unique index community_memberships_community_user_key
  on public.community_memberships (community_id, user_id);

create index community_memberships_user_status_idx
  on public.community_memberships (user_id, status, community_id);

create trigger community_memberships_touch_updated_at
  before update on public.community_memberships
  for each row execute function private.touch_updated_at();

alter table public.community_memberships enable row level security;

revoke all on table public.community_memberships from anon, authenticated;
grant select (id, community_id, user_id, role, status, joined_at, created_at, updated_at)
  on public.community_memberships to authenticated;

create policy community_memberships_select_own on public.community_memberships
  for select
  to authenticated
  using (user_id = (select auth.uid()));
