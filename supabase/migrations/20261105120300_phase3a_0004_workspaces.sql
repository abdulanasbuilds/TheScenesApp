-- Phase 3A Wave 1 — 0004: workspaces and workspace memberships.
--
-- Contract: §3.2, §3.3, §6. No create/update/delete endpoint exists in this slice; these rows are
-- catalogue/seed data and the future creator-workspace foundation.

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text not null,
  slug text not null,
  status text not null default 'active',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_kind_values check (kind in ('creator', 'platform')),
  constraint workspaces_name_len check (char_length(btrim(name)) between 2 and 100),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint workspaces_slug_len check (char_length(slug) between 3 and 60),
  constraint workspaces_status_values check (status in ('active', 'archived'))
);

create unique index workspaces_slug_key on public.workspaces (slug);

create trigger workspaces_touch_updated_at
  before update on public.workspaces
  for each row execute function private.touch_updated_at();

create table public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_memberships_role_values check (role in ('owner', 'admin', 'editor', 'viewer')),
  constraint workspace_memberships_status_values check (status in ('active', 'invited', 'paused', 'removed'))
);

create unique index workspace_memberships_workspace_user_key
  on public.workspace_memberships (workspace_id, user_id);

-- At most one active owner per workspace.
create unique index workspace_memberships_single_active_owner
  on public.workspace_memberships (workspace_id)
  where role = 'owner' and status = 'active';

create index workspace_memberships_user_status_idx
  on public.workspace_memberships (user_id, status, workspace_id);

create trigger workspace_memberships_touch_updated_at
  before update on public.workspace_memberships
  for each row execute function private.touch_updated_at();

alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;

revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_memberships from anon, authenticated;

grant select (id, kind, name, slug, status, created_by, created_at, updated_at)
  on public.workspaces to authenticated;
grant select (id, workspace_id, user_id, role, status, created_at, updated_at)
  on public.workspace_memberships to authenticated;

-- Visible only within the caller's own active membership scope.
create policy workspaces_select_member_scope on public.workspaces
  for select
  to authenticated
  using (
    private.is_workspace_member(
      id,
      array['owner', 'admin', 'editor', 'viewer']
    )
  );

-- Own membership row only.
create policy workspace_memberships_select_own on public.workspace_memberships
  for select
  to authenticated
  using (user_id = (select auth.uid()));
