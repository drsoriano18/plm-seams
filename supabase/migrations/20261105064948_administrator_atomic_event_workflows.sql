create or replace function private.require_admin() returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or private.app_role() <> 'Admin' then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
end $$;

create or replace function public.admin_cancel_event(eid text, reason text)
returns void language plpgsql security invoker set search_path='' as $$
declare ev public.event%rowtype; clean_reason text:=nullif(btrim(reason),'');
begin
  perform private.require_admin();
  if clean_reason is null then raise exception 'Cancellation reason is required' using errcode='22023'; end if;
  select * into ev from public.event where event_id=eid for update;
  if not found then raise exception 'Event not found' using errcode='P0002'; end if;
  if ev.event_status in ('Completed','Cancelled') or ev.starts_at<=statement_timestamp() then
    raise exception 'Only future active events may be cancelled' using errcode='22023';
  end if;
  update public.event set event_status='Cancelled',registration_status='Closed',cancelled_at=statement_timestamp(),cancelled_by=private.app_user_id(),cancellation_reason=clean_reason where event_id=eid;
  update public.venue_booking set booking_status='Cancelled',status_changed_at=statement_timestamp(),change_reason=clean_reason where event_id=eid and booking_status in ('Pending','Confirmed');
  insert into public.notifications(recipient_user_id,event_id,notification_type,message)
  select ev.org_id,eid,'Event Cancelled',ev.event_id||': event cancelled. '||clean_reason;
  insert into public.notifications(recipient_user_id,event_id,notification_type,message)
  select r.student_number,eid,'Event Cancelled','Your registration has been cancelled because this event was cancelled. '||clean_reason
  from public.registration r where r.event_id=eid and r.reg_status in ('Confirmed','Waitlisted');
end $$;
revoke all on function public.admin_cancel_event(text,text) from public,anon;
grant execute on function public.admin_cancel_event(text,text) to authenticated;

create or replace function public.admin_reschedule_event(eid text,new_starts_at timestamptz,new_ends_at timestamptz,new_venue_id text,reason text)
returns void language plpgsql security invoker set search_path='' as $$
declare ev public.event%rowtype; b public.venue_booking%rowtype; clean_reason text:=nullif(btrim(reason),'');
begin
  perform private.require_admin();
  if clean_reason is null then raise exception 'Rescheduling reason is required' using errcode='22023'; end if;
  if new_starts_at is null or new_ends_at is null or new_ends_at<=new_starts_at or new_starts_at<=statement_timestamp() then raise exception 'Invalid future schedule' using errcode='22023'; end if;
  select * into ev from public.event where event_id=eid for update;
  if not found or ev.event_status in ('Completed','Cancelled') or ev.archived_at is not null then raise exception 'Event cannot be rescheduled' using errcode='22023'; end if;
  select * into b from public.venue_booking where event_id=eid and booking_status='Confirmed' order by booking_id limit 1 for update;
  update public.event set starts_at=new_starts_at,ends_at=new_ends_at,rescheduled_at=statement_timestamp(),rescheduled_by=private.app_user_id(),rescheduled_reason=clean_reason where event_id=eid;
  if found and b.booking_id is not null then
    update public.venue_booking set venue_id=coalesce(new_venue_id,venue_id),starts_at=new_starts_at,ends_at=new_ends_at,status_changed_at=statement_timestamp(),change_reason=clean_reason where booking_id=b.booking_id;
  elsif new_venue_id is not null then
    insert into public.venue_booking(booking_id,event_id,venue_id,starts_at,ends_at,buffer_minutes,booking_status,authorized_by,status_changed_at,change_reason)
    values('B-'||substr(replace(gen_random_uuid()::text,'-',''),1,24),eid,new_venue_id,new_starts_at,new_ends_at,60,'Confirmed',private.app_user_id(),statement_timestamp(),clean_reason);
  end if;
  insert into public.notifications(recipient_user_id,event_id,notification_type,message)
  select ev.org_id,eid,'Event Rescheduled',ev.event_id||': event rescheduled. '||clean_reason;
  insert into public.notifications(recipient_user_id,event_id,notification_type,message)
  select r.student_number,eid,'Event Rescheduled','Your registered event has been rescheduled. '||clean_reason
  from public.registration r where r.event_id=eid and r.reg_status in ('Confirmed','Waitlisted');
end $$;
revoke all on function public.admin_reschedule_event(text,timestamptz,timestamptz,text,text) from public,anon;
grant execute on function public.admin_reschedule_event(text,timestamptz,timestamptz,text,text) to authenticated;

create or replace function public.get_event_registration_metrics(eid text)
returns table(confirmed bigint,waitlisted bigint,cancelled bigint,present bigint,absent bigint,unmarked bigint)
language sql stable security invoker set search_path='' as $$
  select count(*) filter(where reg_status='Confirmed'),count(*) filter(where reg_status='Waitlisted'),count(*) filter(where reg_status='Cancelled'),
         count(*) filter(where attendance_status='Present'),count(*) filter(where attendance_status='Absent'),count(*) filter(where reg_status='Confirmed' and attendance_status is null)
  from public.registration r where r.event_id=eid and private.app_role() in ('Admin','Student Organization')
    and (private.app_role()='Admin' or exists(select 1 from public.event e where e.event_id=eid and e.org_id=private.app_user_id()))
$$;
revoke all on function public.get_event_registration_metrics(text) from public,anon;
grant execute on function public.get_event_registration_metrics(text) to authenticated;

create or replace function public.get_event_attendees(eid text,p_limit integer default 50,p_offset integer default 0)
returns table(reg_id varchar,student_number varchar,student_name varchar,reg_status varchar,attendance_status varchar,reg_date timestamptz,waitlist_position integer)
language sql stable security invoker set search_path='' as $$
  select r.reg_id,r.student_number,s.name,r.reg_status,r.attendance_status,r.reg_date,r.waitlist_position
  from public.registration r join public.students s on s.student_number=r.student_number
  where r.event_id=eid and p_limit between 1 and 200 and p_offset>=0 and private.app_role() in ('Admin','Student Organization')
    and (private.app_role()='Admin' or exists(select 1 from public.event e where e.event_id=eid and e.org_id=private.app_user_id()))
  order by r.reg_date,r.reg_id limit p_limit offset p_offset
$$;
revoke all on function public.get_event_attendees(text,integer,integer) from public,anon;
grant execute on function public.get_event_attendees(text,integer,integer) to authenticated;

create or replace function private.notify_admin_new_proposal() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.approval_status in ('Pending') and (TG_OP='INSERT' or old.approval_status is distinct from new.approval_status) then
    insert into public.notifications(recipient_user_id,proposal_id,notification_type,message)
    select a.admin_id,new.proposal_id,'New Proposal Submitted','New proposal submitted: '||coalesce(new.event_name,new.proposal_id)
    from public.administrators a;
  end if;
  return new;
end $$;
drop trigger if exists notify_admin_new_proposal on public.event_proposal;
create trigger notify_admin_new_proposal after insert or update of approval_status on public.event_proposal for each row execute function private.notify_admin_new_proposal();
revoke all on function private.require_admin(),private.notify_admin_new_proposal() from public,anon,authenticated;
notify pgrst,'reload schema';
