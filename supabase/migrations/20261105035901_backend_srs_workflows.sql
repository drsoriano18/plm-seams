-- SRS backend workflows: availability, lifecycle, attendance, drafts, and realtime.
-- All public RPCs are authenticated-only wrappers around private implementations.

create or replace function public.get_venue_availability(
  p_venue_id text, p_from_ts timestamptz, p_to_ts timestamptz
)
returns table(
  booking_id varchar, venue_id varchar, starts_at timestamptz, ends_at timestamptz,
  buffer_minutes integer, booking_status varchar, event_name varchar, organization_name varchar
)
language sql stable security definer set search_path = '' as $$
  select b.booking_id,b.venue_id,b.starts_at,b.ends_at,b.buffer_minutes,b.booking_status,
         p.event_name,o.org_name
  from public.venue_booking b
  join public.event e on e.event_id=b.event_id
  join public.event_proposal p on p.proposal_id=e.proposal_id
  join public.student_organization o on o.org_id=e.org_id
  where b.venue_id=p_venue_id and b.booking_status='Confirmed'
    and b.starts_at < p_to_ts and b.ends_at > p_from_ts
    and auth.uid() is not null and private.app_role() in ('Student Organization','Admin')
  order by b.starts_at,b.booking_id
$$;
revoke all on function public.get_venue_availability(text,timestamptz,timestamptz) from public,anon;
grant execute on function public.get_venue_availability(text,timestamptz,timestamptz) to authenticated;

alter table public.venue_booking
  drop constraint if exists venue_booking_buffer_minutes_check;
update public.venue_booking set buffer_minutes=60 where buffer_minutes < 60;
alter table public.venue_booking
  add constraint venue_booking_buffer_minutes_check check (buffer_minutes >= 60);

create or replace function private.archive_event(eid text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or (private.app_role() not in ('Student Organization','Admin')) then
    raise exception 'Organization or administrator access required' using errcode='42501';
  end if;
  if private.app_role()='Student Organization' and not private.owns_event(eid) then
    raise exception 'Event ownership required' using errcode='42501';
  end if;
  perform set_config('seams.archive_event','on',true);
  update public.event set archived_at=coalesce(archived_at,statement_timestamp())
  where event_id=eid and event_status in ('Completed','Cancelled');
  if not found then raise exception 'Only completed or cancelled events may be archived' using errcode='22023'; end if;
end $$;
create or replace function public.archive_event(eid text) returns void
language sql security invoker set search_path='' as $$ select private.archive_event(eid) $$;
revoke all on function private.archive_event(text),public.archive_event(text) from public,anon;
grant execute on function public.archive_event(text) to authenticated;

create or replace function public.refresh_event_states() returns integer
language plpgsql security invoker set search_path='' as $$
declare changed integer := 0; completed_count integer; ongoing_count integer;
begin
  if private.app_role() not in ('Admin','Student Organization') then raise exception 'Organization or administrator access required' using errcode='42501'; end if;
  update public.event set event_status='Completed', completed_at=coalesce(completed_at,statement_timestamp())
    where event_status in ('Upcoming','Ongoing') and ends_at <= statement_timestamp();
  get diagnostics completed_count = row_count;
  changed := changed + completed_count;
  update public.event set event_status='Ongoing'
    where event_status='Upcoming' and starts_at <= statement_timestamp() and ends_at > statement_timestamp();
  get diagnostics ongoing_count = row_count;
  changed := changed + ongoing_count;
  return changed;
end $$;
revoke all on function public.refresh_event_states() from public,anon;
grant execute on function public.refresh_event_states() to authenticated;

create or replace function private.mark_attendance_bulk(rids text[], p_status text) returns integer
language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
  if auth.uid() is null or private.app_role() <> 'Student Organization' or p_status not in ('Present','Absent') then
    raise exception 'Invalid attendance request' using errcode='42501';
  end if;
  if coalesce(array_length(rids,1),0)=0 then raise exception 'At least one registration is required' using errcode='22023'; end if;
  if exists(
    select 1 from unnest(rids) x(reg_id)
    where not exists(select 1 from public.registration r join public.event e on e.event_id=r.event_id
      where r.reg_id=x.reg_id and r.reg_status='Confirmed' and e.org_id=private.app_user_id()
        and e.archived_at is null and e.starts_at <= statement_timestamp())
  ) then raise exception 'One or more attendance records are invalid' using errcode='42501'; end if;
  update public.registration r set attendance_status=p_status,attendance_marked_at=statement_timestamp(),attendance_marked_by=private.app_user_id()
  where r.reg_id = any(rids) and r.reg_status='Confirmed'
    and exists(select 1 from public.event e where e.event_id=r.event_id and e.org_id=private.app_user_id()
               and e.archived_at is null and e.starts_at <= statement_timestamp());
  get diagnostics changed = row_count;
  return changed;
end $$;
create or replace function public.mark_attendance_bulk(rids text[], p_status text) returns integer
language sql security invoker set search_path='' as $$ select private.mark_attendance_bulk(rids,p_status) $$;
create or replace function public.unmark_attendance(rid text) returns void
language plpgsql security invoker set search_path='' as $$
begin
  update public.registration r set attendance_status=null,attendance_marked_at=null,attendance_marked_by=null
  where r.reg_id=rid and exists(select 1 from public.event e where e.event_id=r.event_id and e.org_id=private.app_user_id())
    and private.app_role()='Student Organization';
  if not found then raise exception 'Attendance record not accessible' using errcode='42501'; end if;
end $$;
revoke all on function private.mark_attendance_bulk(text[],text),public.mark_attendance_bulk(text[],text),public.unmark_attendance(text) from public,anon;
grant execute on function public.mark_attendance_bulk(text[],text),public.unmark_attendance(text) to authenticated;

alter table public.event_proposal drop constraint if exists event_proposal_approval_status_check;
alter table public.event_proposal add constraint event_proposal_approval_status_check check
  (approval_status in ('Draft','Pending','Approved','Rejected','Revisions Required'));
alter table public.event_proposal alter column objectives drop not null;
alter table public.event_proposal alter column description drop not null;
alter table public.event_proposal alter column event_type_id drop not null;
alter table public.event_proposal alter column expected_count_attendees set default 0;
alter table public.event_proposal alter column eligibility_mode set default 'University-Wide';

create or replace function private.check_proposal_notice() returns trigger language plpgsql set search_path = '' as $$
declare pid text; submitted timestamptz; earliest timestamptz; parent_status text;
begin
  if TG_TABLE_NAME='event_proposal' then
    pid:=case when TG_OP='DELETE' then old.proposal_id else new.proposal_id end;
  else
    pid:=case when TG_OP='DELETE' then old.proposal_id else new.proposal_id end;
  end if;
  select approval_status,submission_date into parent_status,submitted from public.event_proposal where proposal_id=pid;
  if not found or parent_status='Draft' then return null; end if;
  select min(starts_at) into earliest from public.proposal_schedule where proposal_id=pid;
  if earliest is null then raise exception 'A proposal must include at least one event schedule' using errcode='23514'; end if;
  if earliest < greatest(submitted,statement_timestamp()) + interval '360 hours' then
    raise exception 'Every event schedule must start at least 15 full days from submission or schedule change.' using errcode='23514';
  end if;
  return null;
end $$;

create or replace function private.save_proposal_draft(proposal jsonb, schedules jsonb, pid text default null)
returns text language plpgsql security definer set search_path='' as $$
declare out_id text := coalesce(nullif(pid,''),'P-'||substr(replace(gen_random_uuid()::text,'-',''),1,24));
begin
  if private.app_role() <> 'Student Organization' then raise exception 'Only student organizations may save drafts' using errcode='42501'; end if;
  if pid is null then
    insert into public.event_proposal(proposal_id,org_id,event_name,objectives,description,event_type_id,expected_count_attendees,eligibility_mode,allowed_college,approval_status,submission_date)
    values(out_id,private.app_user_id(),coalesce(proposal->>'event_name','Untitled'),proposal->>'objectives',proposal->>'description',nullif(proposal->>'event_type_id',''),coalesce((proposal->>'expected_count_attendees')::int,0),coalesce(proposal->>'eligibility_mode','University-Wide'),proposal->>'allowed_college','Draft',statement_timestamp());
  else
    update public.event_proposal set event_name=coalesce(proposal->>'event_name',event_name),objectives=coalesce(proposal->>'objectives',objectives),description=coalesce(proposal->>'description',description),approval_status='Draft'
    where proposal_id=out_id and org_id=private.app_user_id();
    if not found then raise exception 'Draft not found' using errcode='42501'; end if;
  end if;
  if jsonb_typeof(schedules)='array' then
    delete from public.proposal_schedule where proposal_id=out_id;
    insert into public.proposal_schedule(schedule_id,proposal_id,venue_id,starts_at,ends_at,schedule_type)
    select 'S-'||substr(replace(gen_random_uuid()::text,'-',''),1,24),out_id,nullif(s->>'venue_id',''),(s->>'starts_at')::timestamptz,(s->>'ends_at')::timestamptz,coalesce(s->>'schedule_type','Primary')
    from jsonb_array_elements(schedules) s;
  end if;
  return out_id;
end $$;
create or replace function public.save_proposal_draft(proposal jsonb, schedules jsonb, pid text default null)
returns text language sql security invoker set search_path='' as $$ select private.save_proposal_draft(proposal,schedules,pid) $$;
revoke all on function private.save_proposal_draft(jsonb,jsonb,text),public.save_proposal_draft(jsonb,jsonb,text) from public,anon;
grant execute on function public.save_proposal_draft(jsonb,jsonb,text) to authenticated;

create or replace function public.delete_proposal(pid text) returns void
language plpgsql security invoker set search_path='' as $$
begin
  if private.app_role() <> 'Student Organization' then raise exception 'Organization access required' using errcode='42501'; end if;
  if not exists(select 1 from public.event_proposal where proposal_id=pid and org_id=private.app_user_id() and approval_status='Draft') then
    raise exception 'Only your drafts may be deleted' using errcode='42501';
  end if;
  delete from public.proposal_schedule where proposal_id=pid;
  delete from public.proposal_review where proposal_id=pid;
  delete from public.event_proposal where proposal_id=pid;
end $$;
revoke all on function public.delete_proposal(text) from public,anon;
grant execute on function public.delete_proposal(text) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.event;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.registration;
exception when duplicate_object then null; end $$;

create or replace function private.guard_event() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if coalesce(current_setting('seams.archive_event',true),'off')='on' then
    if new.event_id is distinct from old.event_id or new.event_status is distinct from old.event_status
       or new.archived_at is null or new.archived_at < old.archived_at then
      raise exception 'Archive operation may only set archived_at' using errcode='42501';
    end if;
    return new;
  end if;
  if private.app_role()='Student Organization' then
    if (to_jsonb(new)-array['post_caption','publication_status','published_at','registration_status'])
       is distinct from (to_jsonb(old)-array['post_caption','publication_status','published_at','registration_status']) then
      raise exception 'Organizations may edit only publication, caption and registration visibility' using errcode='42501';
    end if;
    if new.event_status in ('Completed','Cancelled') and new.publication_status='Published' then
      raise exception 'Completed or cancelled events cannot be published' using errcode='23514';
    end if;
    if new.event_status in ('Completed','Cancelled') and new.registration_status='Open' then
      raise exception 'Completed or cancelled events cannot accept registrations' using errcode='23514';
    end if;
  end if;
  if new.registration_status='Open' and new.publication_status<>'Published' then
    raise exception 'Publish the event before opening registration' using errcode='23514';
  end if;
  return new;
end $$;

notify pgrst,'reload schema';
