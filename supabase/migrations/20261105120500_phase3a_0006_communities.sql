-- Phase 3A Wave 1 — 0006: communities.
--
-- Contract: §3.5, §6. Public discovery exposes listed+published metadata; unlisted metadata is
-- visible only to active members or named active workspace manager roles.

-- Immutable validator for the bounded language-tag array (used by a CHECK constraint, which cannot
-- contain a subquery directly).
create or replace function private.is_valid_language_tag_array(arr text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    arr is not null
    and cardinality(arr) between 1 and 8
    and cardinality(arr) = cardinality(array(select distinct x from unnest(arr) as x))
    and not exists (
      select 1 from unnest(arr) as x
      where x !~ '^[a-z]{2,3}(?:-[a-z]{2})?$'
    );
$$;

revoke all on function private.is_valid_language_tag_array(text[]) from public;

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  slug text not null,
  name text not null,
  tagline text not null,
  description text not null,
  privacy text not null,
  join_policy text not null,
  discoverability text not null default 'listed',
  status text not null,
  accent_hue smallint not null,
  languages text[] not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communities_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint communities_slug_len check (char_length(slug) between 3 and 80),
  constraint communities_name_len check (char_length(btrim(name)) between 2 and 100),
  constraint communities_tagline_len check (char_length(btrim(tagline)) between 1 and 160),
  constraint communities_description_len check (char_length(btrim(description)) between 1 and 4000),
  constraint communities_privacy_values check (privacy in ('public', 'private')),
  constraint communities_join_policy_values check (join_policy in ('open', 'invite')),
  constraint communities_discoverability_values check (discoverability in ('listed', 'unlisted')),
  constraint communities_status_values check (status in ('draft', 'published', 'archived')),
  constraint communities_accent_hue_range check (accent_hue between 0 and 359),
  constraint communities_languages_valid check (private.is_valid_language_tag_array(languages)),
  constraint communities_private_requires_invite check (privacy <> 'private' or join_policy = 'invite'),
  constraint communities_published_at_agrees check ((status = 'published') = (published_at is not null))
);

create unique index communities_slug_key on public.communities (slug);
create unique index communities_id_workspace_key on public.communities (id, workspace_id);

create index communities_workspace_idx on public.communities (workspace_id);
create index communities_discovery_idx
  on public.communities (published_at desc, id desc)
  where status = 'published' and discoverability = 'listed';

create trigger communities_touch_updated_at
  before update on public.communities
  for each row execute function private.touch_updated_at();

alter table public.communities enable row level security;

revoke all on table public.communities from anon, authenticated;
grant select (
  id, workspace_id, slug, name, tagline, description, privacy, join_policy,
  discoverability, accent_hue, languages, published_at, created_at, updated_at
) on public.communities to anon, authenticated;

create policy communities_select_listed on public.communities
  for select
  to anon, authenticated
  using (status = 'published' and discoverability = 'listed');

-- Members see published communities (including unlisted ones). Draft/archived rows are reserved for
-- named active workspace managers (contract §6: never readable merely through membership).
create policy communities_select_member on public.communities
  for select
  to authenticated
  using (
    status = 'published'
    and private.is_community_member(id, array['member', 'moderator', 'manager'])
  );

create policy communities_select_manager on public.communities
  for select
  to authenticated
  using (private.is_workspace_member(workspace_id, array['owner', 'admin', 'editor']));
