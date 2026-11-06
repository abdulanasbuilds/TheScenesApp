-- Phase 3A Wave 1 — 0015: course enrollments.
--
-- Contract: §3.14, §6. `unique (id, course_id)` is the target of the completions composite FK.

create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'active',
  source text not null,
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_enrollments_status_values check (status in ('active', 'cancelled')),
  constraint course_enrollments_source_values check (source in ('self', 'seed'))
);

create unique index course_enrollments_course_user_key
  on public.course_enrollments (course_id, user_id);
create unique index course_enrollments_id_course_key
  on public.course_enrollments (id, course_id);

-- My Learning ordering, unfiltered and status-filtered.
create index course_enrollments_user_updated_idx
  on public.course_enrollments (user_id, updated_at desc, id desc);
create index course_enrollments_user_status_updated_idx
  on public.course_enrollments (user_id, status, updated_at desc, id desc);

create trigger course_enrollments_touch_updated_at
  before update on public.course_enrollments
  for each row execute function private.touch_updated_at();

alter table public.course_enrollments enable row level security;

revoke all on table public.course_enrollments from anon, authenticated;
grant select (id, course_id, user_id, status, source, enrolled_at, created_at, updated_at)
  on public.course_enrollments to authenticated;

create policy course_enrollments_select_own on public.course_enrollments
  for select
  to authenticated
  using (user_id = (select auth.uid()));
