-- Phase 3A Wave 1 — 0013: lesson contents (versioned blocks).
--
-- Contract: §3.12, §6. Version 1 blocks are validated by the shared Zod schema before rendering;
-- SQL enforces the top-level array, bounds, and version only.

create table public.lesson_contents (
  lesson_id uuid primary key references public.lessons (id) on delete cascade,
  body_version smallint not null default 1,
  body jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_contents_body_version_value check (body_version = 1),
  constraint lesson_contents_body_is_array check (
    case
      when jsonb_typeof(body) = 'array'
        then jsonb_array_length(body) between 1 and 100
      else false
    end
  )
);

create trigger lesson_contents_touch_updated_at
  before update on public.lesson_contents
  for each row execute function private.touch_updated_at();

alter table public.lesson_contents enable row level security;

revoke all on table public.lesson_contents from anon, authenticated;
grant select (lesson_id, body_version, body, created_at, updated_at)
  on public.lesson_contents to anon, authenticated;

-- Preview content for any visible lesson.
create policy lesson_contents_select_preview on public.lesson_contents
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_contents.lesson_id and l.is_preview
    )
  );

-- Protected content requires an active profile, own active enrolment, and active community access.
create policy lesson_contents_select_enrolled on public.lesson_contents
  for select
  to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_contents.lesson_id
        and private.can_access_course_content(l.course_id)
    )
  );
