-- Phase 3A Wave 1 — 0012: lessons.
--
-- Contract: §3.11, §6. Composite FK structurally enforces module/course consistency; there is no
-- synchronization trigger. `unique (course_id, id)` is the target of the completions composite FK.

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid not null,
  slug text not null,
  title text not null,
  summary text not null,
  kind text not null,
  duration_minutes smallint not null,
  is_preview boolean not null default false,
  position smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_module_course_fk
    foreign key (course_id, module_id)
    references public.course_modules (course_id, id)
    on update restrict on delete cascade,
  constraint lessons_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint lessons_slug_len check (char_length(slug) between 3 and 100),
  constraint lessons_title_len check (char_length(btrim(title)) between 2 and 180),
  constraint lessons_summary_len check (char_length(btrim(summary)) between 1 and 500),
  constraint lessons_kind_values check (kind in ('video', 'reading', 'exercise')),
  constraint lessons_duration_range check (duration_minutes between 1 and 600),
  constraint lessons_position_min check (position >= 1)
);

create unique index lessons_course_slug_key on public.lessons (course_id, slug);
create unique index lessons_module_position_key on public.lessons (module_id, position);
create unique index lessons_course_id_key on public.lessons (id, course_id);
create index lessons_module_idx on public.lessons (module_id);

create trigger lessons_touch_updated_at
  before update on public.lessons
  for each row execute function private.touch_updated_at();

alter table public.lessons enable row level security;

revoke all on table public.lessons from anon, authenticated;
grant select (
  id, course_id, module_id, slug, title, summary, kind, duration_minutes,
  is_preview, position, created_at, updated_at
) on public.lessons to anon, authenticated;

create policy lessons_select_visible on public.lessons
  for select
  to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = lessons.course_id));
