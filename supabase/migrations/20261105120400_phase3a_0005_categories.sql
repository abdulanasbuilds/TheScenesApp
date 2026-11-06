-- Phase 3A Wave 1 — 0005: categories (read-only public taxonomy).
--
-- Contract: §3.4, §6. No client writes.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  blurb text not null,
  accent_hue smallint not null,
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_slug_len check (char_length(slug) between 2 and 60),
  constraint categories_name_len check (char_length(btrim(name)) between 2 and 80),
  constraint categories_blurb_len check (char_length(btrim(blurb)) between 1 and 240),
  constraint categories_accent_hue_range check (accent_hue between 0 and 359),
  constraint categories_sort_order_nonneg check (sort_order >= 0),
  constraint categories_status_values check (status in ('active', 'hidden'))
);

create unique index categories_slug_key on public.categories (slug);
create index categories_active_sort_idx
  on public.categories (sort_order, id)
  where status = 'active';

create trigger categories_touch_updated_at
  before update on public.categories
  for each row execute function private.touch_updated_at();

alter table public.categories enable row level security;

revoke all on table public.categories from anon, authenticated;
grant select (id, slug, name, blurb, accent_hue, sort_order)
  on public.categories to anon, authenticated;

create policy categories_select_active on public.categories
  for select
  to anon, authenticated
  using (status = 'active');
