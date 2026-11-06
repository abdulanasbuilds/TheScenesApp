-- Phase 3A Wave 1 — 0009: courses.
--
-- Contract: §3.8, §6. Composite FK keeps a course inside the workspace that owns its community.

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  community_id uuid not null,
  category_id uuid references public.categories (id) on delete restrict,
  instructor_id uuid not null references public.profiles (id) on delete restrict,
  slug text not null,
  title text not null,
  subtitle text not null,
  description text not null,
  level text not null,
  access text not null,
  status text not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_community_workspace_fk
    foreign key (community_id, workspace_id)
    references public.communities (id, workspace_id)
    on update restrict on delete restrict,
  constraint courses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint courses_slug_len check (char_length(slug) between 3 and 100),
  constraint courses_title_len check (char_length(btrim(title)) between 2 and 140),
  constraint courses_subtitle_len check (char_length(btrim(subtitle)) between 1 and 220),
  constraint courses_description_len check (char_length(btrim(description)) between 1 and 5000),
  constraint courses_level_values check (level in ('beginner', 'intermediate', 'advanced')),
  constraint courses_access_values check (access in ('included', 'restricted')),
  constraint courses_status_values check (status in ('draft', 'published', 'archived')),
  constraint courses_published_at_agrees check ((status = 'published') = (published_at is not null))
);

create unique index courses_workspace_slug_key on public.courses (workspace_id, slug);
create unique index courses_id_workspace_key on public.courses (id, workspace_id);

create index courses_community_list_idx
  on public.courses (community_id, status, published_at desc, id desc);
create index courses_workspace_idx on public.courses (workspace_id);
create index courses_category_idx on public.courses (category_id);
create index courses_instructor_idx on public.courses (instructor_id);

create trigger courses_touch_updated_at
  before update on public.courses
  for each row execute function private.touch_updated_at();

alter table public.courses enable row level security;

revoke all on table public.courses from anon, authenticated;
grant select (
  id, workspace_id, community_id, category_id, instructor_id, slug, title, subtitle,
  description, level, access, published_at, created_at, updated_at
) on public.courses to anon, authenticated;

-- Published courses of publicly visible (listed + published) communities.
create policy courses_select_listed on public.courses
  for select
  to anon, authenticated
  using (
    status = 'published'
    and exists (select 1 from public.communities c where c.id = courses.community_id)
  );

-- Active community members see published courses of their (possibly unlisted) communities. The
-- communities subquery applies that table's RLS, so a draft/archived community stays hidden.
create policy courses_select_member on public.courses
  for select
  to authenticated
  using (
    status = 'published'
    and private.is_community_member(community_id, array['member', 'moderator', 'manager'])
    and exists (select 1 from public.communities c where c.id = courses.community_id)
  );

-- Named active workspace roles see all statuses, including drafts.
create policy courses_select_manager on public.courses
  for select
  to authenticated
  using (private.is_workspace_member(workspace_id, array['owner', 'admin', 'editor']));
