-- Phase 3A Wave 1 — 0003: private authorization helpers.
--
-- Contract: §5.1. These are the only definer helpers, all STABLE, empty search path, and
-- executable only by `authenticated`. Bodies reference tables created later in dependency order,
-- so body validation is deferred to first call (all objects exist by the end of the reset).

set check_function_bodies = off;

create or replace function private.is_workspace_member(p_workspace_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_memberships m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create or replace function private.is_community_member(p_community_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_memberships m
    where m.community_id = p_community_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create or replace function private.has_active_enrollment(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.course_enrollments e
    where e.course_id = p_course_id
      and e.user_id = auth.uid()
      and e.status = 'active'
  );
$$;

create or replace function private.can_access_course_content(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_active_profile()
    and exists (
      select 1 from public.course_enrollments e
      where e.course_id = p_course_id
        and e.user_id = auth.uid()
        and e.status = 'active'
    )
    and exists (
      select 1 from public.courses c
      where c.id = p_course_id
        and exists (
          select 1 from public.community_memberships m
          where m.community_id = c.community_id
            and m.user_id = auth.uid()
            and m.status = 'active'
        )
    );
$$;

revoke all on function private.is_workspace_member(uuid, text[]) from public;
revoke all on function private.is_community_member(uuid, text[]) from public;
revoke all on function private.has_active_enrollment(uuid) from public;
revoke all on function private.can_access_course_content(uuid) from public;

grant execute on function private.is_workspace_member(uuid, text[]) to authenticated;
grant execute on function private.is_community_member(uuid, text[]) to authenticated;
grant execute on function private.has_active_enrollment(uuid) to authenticated;
grant execute on function private.can_access_course_content(uuid) to authenticated;

-- Restore reset-time body validation for every later migration.
set check_function_bodies = on;
