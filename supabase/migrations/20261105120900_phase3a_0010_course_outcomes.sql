-- Phase 3A Wave 1 — 0010: course outcomes.
--
-- Contract: §3.9, §6. Visible only when the parent course outline is visible.

create table public.course_outcomes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position smallint not null,
  body text not null,
  constraint course_outcomes_position_range check (position between 1 and 12),
  constraint course_outcomes_body_len check (char_length(btrim(body)) between 1 and 240)
);

create unique index course_outcomes_course_position_key
  on public.course_outcomes (course_id, position);

alter table public.course_outcomes enable row level security;

revoke all on table public.course_outcomes from anon, authenticated;
grant select (id, course_id, position, body)
  on public.course_outcomes to anon, authenticated;

create policy course_outcomes_select_visible on public.course_outcomes
  for select
  to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_outcomes.course_id));
