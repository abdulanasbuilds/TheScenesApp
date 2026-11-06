-- Phase 3A Wave 1 — 0011: course modules.
--
-- Contract: §3.10, §6. `unique (course_id, id)` is the target of the lessons composite FK.

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position smallint not null,
  constraint course_modules_title_len check (char_length(btrim(title)) between 2 and 140),
  constraint course_modules_position_min check (position >= 1)
);

create unique index course_modules_course_position_key
  on public.course_modules (course_id, position);
create unique index course_modules_course_id_key
  on public.course_modules (course_id, id);

alter table public.course_modules enable row level security;

revoke all on table public.course_modules from anon, authenticated;
grant select (id, course_id, title, position)
  on public.course_modules to anon, authenticated;

create policy course_modules_select_visible on public.course_modules
  for select
  to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_modules.course_id));
