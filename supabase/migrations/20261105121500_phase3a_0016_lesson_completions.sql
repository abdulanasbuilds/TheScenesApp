-- Phase 3A Wave 1 — 0016: lesson completions.
--
-- Contract: §3.15, §6. The two composite FKs make cross-course completion structurally impossible.

create table public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null,
  lesson_id uuid not null,
  course_id uuid not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint lesson_completions_enrollment_course_fk
    foreign key (enrollment_id, course_id)
    references public.course_enrollments (id, course_id)
    on update restrict on delete restrict,
  constraint lesson_completions_lesson_course_fk
    foreign key (lesson_id, course_id)
    references public.lessons (id, course_id)
    on update restrict on delete restrict
);

create unique index lesson_completions_enrollment_lesson_key
  on public.lesson_completions (enrollment_id, lesson_id);

alter table public.lesson_completions enable row level security;

revoke all on table public.lesson_completions from anon, authenticated;
grant select (id, enrollment_id, lesson_id, course_id, completed_at, created_at)
  on public.lesson_completions to authenticated;

-- Own rows only; the subquery on course_enrollments already applies that table's own-row RLS.
create policy lesson_completions_select_own on public.lesson_completions
  for select
  to authenticated
  using (exists (select 1 from public.course_enrollments e where e.id = lesson_completions.enrollment_id));
