-- Phase 3A Wave 1 — 0014: lesson resources.
--
-- Contract: §3.13, §6. SQL enforces https, printable characters, and no credentials; deeper URL
-- canonicalization lives in the application parser.

create table public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  label text not null,
  kind text not null,
  url text not null,
  position smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_resources_label_len check (char_length(btrim(label)) between 1 and 120),
  constraint lesson_resources_kind_values check (kind in ('link', 'pdf', 'sheet', 'repo')),
  constraint lesson_resources_url_len check (char_length(url) between 1 and 2048),
  constraint lesson_resources_url_https check (url ~ '^https://[^[:space:]]+$'),
  constraint lesson_resources_url_no_control check (url !~ '[[:cntrl:]]'),
  constraint lesson_resources_url_no_userinfo check (split_part(url, '/', 3) not like '%@%'),
  constraint lesson_resources_position_min check (position >= 1)
);

create unique index lesson_resources_lesson_position_key
  on public.lesson_resources (lesson_id, position);
create index lesson_resources_lesson_idx on public.lesson_resources (lesson_id);

create trigger lesson_resources_touch_updated_at
  before update on public.lesson_resources
  for each row execute function private.touch_updated_at();

alter table public.lesson_resources enable row level security;

revoke all on table public.lesson_resources from anon, authenticated;
grant select (id, lesson_id, label, kind, url, position, created_at, updated_at)
  on public.lesson_resources to anon, authenticated;

create policy lesson_resources_select_preview on public.lesson_resources
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_resources.lesson_id and l.is_preview
    )
  );

create policy lesson_resources_select_enrolled on public.lesson_resources
  for select
  to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_resources.lesson_id
        and private.can_access_course_content(l.course_id)
    )
  );
