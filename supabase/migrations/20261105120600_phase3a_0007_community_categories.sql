-- Phase 3A Wave 1 — 0007: community ↔ category links.
--
-- Contract: §3.6, §6. Visible only when the parent community metadata is visible.

create table public.community_categories (
  community_id uuid not null references public.communities (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  is_primary boolean not null default false,
  constraint community_categories_pkey primary key (community_id, category_id)
);

-- At most one primary category per community.
create unique index community_categories_single_primary
  on public.community_categories (community_id)
  where is_primary;

create index community_categories_category_idx
  on public.community_categories (category_id, community_id);

alter table public.community_categories enable row level security;

revoke all on table public.community_categories from anon, authenticated;
grant select (community_id, category_id, is_primary)
  on public.community_categories to anon, authenticated;

-- The subquery on public.communities applies that table's RLS in the caller's context, so this
-- policy tracks community visibility without duplicating it.
create policy community_categories_select_visible on public.community_categories
  for select
  to anon, authenticated
  using (exists (select 1 from public.communities c where c.id = community_categories.community_id));
