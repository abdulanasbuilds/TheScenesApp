-- Phase 3A Wave 1 — 0018: caller-bound command functions.
--
-- Contract: §5.2. Each command derives auth.uid(), requires an active profile, accepts no
-- actor/role/status/timestamp input, rejects a null request_id before mutation, and returns a
-- bounded JSON result. Only `authenticated` may execute these signatures.
--
-- Concurrency: absent-row races use INSERT ... ON CONFLICT ... RETURNING; state transitions use a
-- locked conditional update RETURNING the winner. Only the winner writes an audit event.

create or replace function public.join_community(p_community_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.community_memberships;
  v_had boolean;
  v_eligible boolean;
  v_row public.community_memberships;
begin
  if p_request_id is null then
    raise exception 'request_id_required' using errcode = '22023';
  end if;
  if v_uid is null or not private.is_active_profile() then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;

  select * into v_existing
  from public.community_memberships
  where community_id = p_community_id and user_id = v_uid
  for update;
  v_had := found;

  if v_had and v_existing.status = 'active' then
    return jsonb_build_object(
      'ok', true, 'changed', false,
      'membership', jsonb_build_object('communityId', p_community_id, 'role', v_existing.role, 'status', 'active')
    );
  end if;

  -- Only absent -> active and left -> active transitions are permitted.
  if v_had and v_existing.status <> 'left' then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  select (
    c.status = 'published'
    and c.discoverability = 'listed'
    and c.privacy = 'public'
    and c.join_policy = 'open'
  )
  into v_eligible
  from public.communities c
  where c.id = p_community_id;

  if v_eligible is distinct from true then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if not v_had then
    insert into public.community_memberships (community_id, user_id, role, status, joined_at)
    values (p_community_id, v_uid, 'member', 'active', now())
    on conflict (community_id, user_id) do nothing
    returning * into v_row;

    if not found then
      select * into v_row from public.community_memberships
      where community_id = p_community_id and user_id = v_uid;
      return jsonb_build_object(
        'ok', true, 'changed', false,
        'membership', jsonb_build_object('communityId', p_community_id, 'role', v_row.role, 'status', v_row.status)
      );
    end if;
  else
    update public.community_memberships
    set status = 'active', joined_at = coalesce(joined_at, now())
    where id = v_existing.id and status = 'left'
    returning * into v_row;

    if not found then
      select * into v_row from public.community_memberships where id = v_existing.id;
      return jsonb_build_object(
        'ok', true, 'changed', false,
        'membership', jsonb_build_object('communityId', p_community_id, 'role', v_row.role, 'status', v_row.status)
      );
    end if;
  end if;

  insert into private.audit_events (actor_id, action, target_type, target_id, request_id, metadata)
  values (v_uid, 'community.joined', 'community', p_community_id, p_request_id, jsonb_build_object());

  return jsonb_build_object(
    'ok', true, 'changed', true,
    'membership', jsonb_build_object('communityId', p_community_id, 'role', 'member', 'status', 'active')
  );
end;
$$;

create or replace function public.leave_community(p_community_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.community_memberships;
  v_row public.community_memberships;
begin
  if p_request_id is null then
    raise exception 'request_id_required' using errcode = '22023';
  end if;
  if v_uid is null or not private.is_active_profile() then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;

  select * into v_existing
  from public.community_memberships
  where community_id = p_community_id and user_id = v_uid
  for update;

  if not found or v_existing.status <> 'active' then
    return jsonb_build_object('ok', true, 'changed', false, 'membershipState', 'not-member');
  end if;

  update public.community_memberships
  set status = 'left'
  where id = v_existing.id and status = 'active'
  returning * into v_row;

  if not found then
    return jsonb_build_object('ok', true, 'changed', false, 'membershipState', 'not-member');
  end if;

  insert into private.audit_events (actor_id, action, target_type, target_id, request_id, metadata)
  values (v_uid, 'community.left', 'community', p_community_id, p_request_id, jsonb_build_object());

  return jsonb_build_object('ok', true, 'changed', true, 'membershipState', 'left');
end;
$$;

create or replace function public.enrol_in_course(p_course_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.course_enrollments;
  v_had boolean;
  v_eligible boolean;
  v_row public.course_enrollments;
begin
  if p_request_id is null then
    raise exception 'request_id_required' using errcode = '22023';
  end if;
  if v_uid is null or not private.is_active_profile() then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;

  select * into v_existing
  from public.course_enrollments
  where course_id = p_course_id and user_id = v_uid
  for update;
  v_had := found;

  if v_had then
    -- Active is an idempotent no-op; cancelled is not reactivated in this slice.
    return jsonb_build_object(
      'ok', true, 'changed', false,
      'enrollment', jsonb_build_object('id', v_existing.id, 'courseId', p_course_id, 'status', v_existing.status)
    );
  end if;

  select (
    c.status = 'published'
    and (
      (
        com.status = 'published'
        and com.discoverability = 'listed'
        and com.privacy = 'public'
        and com.join_policy = 'open'
      )
      or private.is_community_member(c.community_id, array['member', 'moderator', 'manager'])
    )
  )
  into v_eligible
  from public.courses c
  join public.communities com on com.id = c.community_id
  where c.id = p_course_id;

  if v_eligible is distinct from true then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  insert into public.course_enrollments (course_id, user_id, status, source)
  values (p_course_id, v_uid, 'active', 'self')
  on conflict (course_id, user_id) do nothing
  returning * into v_row;

  if not found then
    select * into v_row from public.course_enrollments
    where course_id = p_course_id and user_id = v_uid;
    return jsonb_build_object(
      'ok', true, 'changed', false,
      'enrollment', jsonb_build_object('id', v_row.id, 'courseId', p_course_id, 'status', v_row.status)
    );
  end if;

  insert into private.audit_events (actor_id, action, target_type, target_id, request_id, metadata)
  values (v_uid, 'course.enrolled', 'course', p_course_id, p_request_id, jsonb_build_object());

  return jsonb_build_object(
    'ok', true, 'changed', true,
    'enrollment', jsonb_build_object('id', v_row.id, 'courseId', p_course_id, 'status', 'active')
  );
end;
$$;

create or replace function public.complete_lesson(p_lesson_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_course_id uuid;
  v_enrollment_id uuid;
  v_row public.lesson_completions;
  v_changed boolean;
  v_total integer;
  v_done integer;
begin
  if p_request_id is null then
    raise exception 'request_id_required' using errcode = '22023';
  end if;
  if v_uid is null or not private.is_active_profile() then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;

  select course_id into v_course_id from public.lessons where id = p_lesson_id;
  if v_course_id is null then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if not private.can_access_course_content(v_course_id) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  select id into v_enrollment_id
  from public.course_enrollments
  where course_id = v_course_id and user_id = v_uid and status = 'active';

  if v_enrollment_id is null then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  insert into public.lesson_completions (enrollment_id, lesson_id, course_id)
  values (v_enrollment_id, p_lesson_id, v_course_id)
  on conflict (enrollment_id, lesson_id) do nothing
  returning * into v_row;

  v_changed := found;

  if v_changed then
    insert into private.audit_events (actor_id, action, target_type, target_id, request_id, metadata)
    values (v_uid, 'lesson.completed', 'lesson', p_lesson_id, p_request_id, jsonb_build_object());
  else
    select * into v_row from public.lesson_completions
    where enrollment_id = v_enrollment_id and lesson_id = p_lesson_id;
  end if;

  select count(*) into v_total from public.lessons where course_id = v_course_id;
  select count(*) into v_done from public.lesson_completions where enrollment_id = v_enrollment_id;

  return jsonb_build_object(
    'ok', true,
    'changed', v_changed,
    'completion', jsonb_build_object('id', v_row.id, 'lessonId', p_lesson_id, 'completedAt', v_row.completed_at),
    'learningStatus',
      case
        when v_done = 0 then 'not-started'
        when v_done >= v_total then 'completed'
        else 'in-progress'
      end,
    'completedLessons', v_done,
    'totalLessons', v_total,
    'progressPercent', case when v_total = 0 then 0 else round(100.0 * v_done / v_total) end
  );
end;
$$;

revoke all on function public.join_community(uuid, uuid) from public;
revoke all on function public.leave_community(uuid, uuid) from public;
revoke all on function public.enrol_in_course(uuid, uuid) from public;
revoke all on function public.complete_lesson(uuid, uuid) from public;

grant execute on function public.join_community(uuid, uuid) to authenticated;
grant execute on function public.leave_community(uuid, uuid) to authenticated;
grant execute on function public.enrol_in_course(uuid, uuid) to authenticated;
grant execute on function public.complete_lesson(uuid, uuid) to authenticated;
