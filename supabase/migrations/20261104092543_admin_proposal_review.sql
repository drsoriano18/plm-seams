-- Keep review history, decision, unpublished event, primary reservation, and notification atomic.
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions, pg_catalog;

-- UTC timestamp arithmetic is immutable; preserve each existing booking's setup/cleanup buffer.
alter table public.venue_booking add constraint venue_booking_no_overlapping_confirmed
exclude using gist (
  venue_id with =,
  tsrange(
    (starts_at at time zone 'UTC') - make_interval(mins => buffer_minutes),
    (ends_at at time zone 'UTC') + make_interval(mins => buffer_minutes), '[)'
  ) with &&
) where (booking_status = 'Confirmed');

-- Schedule edits and review take the same parent lock. Re-check organization access after waiting.
create function private.lock_proposal_schedule_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare parent_id text; parent_status text;
begin
  if TG_OP='DELETE' then parent_id:=old.proposal_id; else parent_id:=new.proposal_id; end if;
  if TG_OP='UPDATE' and new.proposal_id is distinct from old.proposal_id then
    raise exception 'Schedule proposal cannot be changed' using errcode='23514';
  end if;
  select approval_status into parent_status from public.event_proposal where proposal_id=parent_id for update;
  if private.app_role()='Student Organization' and parent_status not in ('Pending','Revisions Required') then
    raise exception 'This proposal is no longer editable' using errcode='42501';
  end if;
  if TG_OP='DELETE' then return old; else return new; end if;
end $$;
revoke all on function private.lock_proposal_schedule_review() from public, anon, authenticated;
create trigger lock_proposal_schedule_review before insert or update or delete on public.proposal_schedule
for each row execute function private.lock_proposal_schedule_review();

create or replace function public.review_proposal(pid text, decision text, remarks text default null) returns void
language plpgsql security invoker set search_path='' as $$
declare
  proposal public.event_proposal%rowtype;
  primary_schedule public.proposal_schedule%rowtype;
  primary_count integer;
  requires_room boolean;
  new_event_id text;
  reviewer_id text;
  clean_remarks text := nullif(btrim(remarks), '');
begin
  if private.app_role() is distinct from 'Admin' then
    raise exception 'Administrator review required' using errcode='42501';
  end if;
  if decision is null or decision not in ('Approved','Rejected','Revisions Required') then
    raise exception 'Choose a valid review decision' using errcode='22023';
  end if;
  if decision in ('Rejected','Revisions Required') and clean_remarks is null then
    raise exception 'Admin remarks are required for rejection or return for revisions' using errcode='22023';
  end if;
  if char_length(clean_remarks)>2000 then
    raise exception 'Admin remarks must be 2000 characters or fewer' using errcode='22023';
  end if;
  select * into proposal from public.event_proposal where proposal_id=pid for update;
  if not found then raise exception 'Proposal not found' using errcode='P0002'; end if;
  if proposal.approval_status<>'Pending' then
    raise exception 'This proposal has already been reviewed. Reload to see its current status.' using errcode='40001';
  end if;
  reviewer_id:=private.app_user_id();

  if decision='Approved' then
    select count(*) into primary_count from public.proposal_schedule where proposal_id=pid and schedule_type='Primary';
    if primary_count<>1 then
      raise exception 'Approval requires exactly one primary schedule. Return the proposal for revisions.' using errcode='22023';
    end if;
    select * into primary_schedule from public.proposal_schedule where proposal_id=pid and schedule_type='Primary';
    if primary_schedule.starts_at<=statement_timestamp() then
      raise exception 'The primary schedule must be in the future. Return the proposal for revisions.' using errcode='22023';
    end if;
    select requires_venue into requires_room from public.event_type where event_type_id=proposal.event_type_id;
    if requires_room and primary_schedule.venue_id is null then
      raise exception 'The primary schedule needs a venue. Return the proposal for revisions.' using errcode='22023';
    end if;
    if exists(select 1 from public.event where proposal_id=pid) then
      raise exception 'An event already exists for this proposal. Reload to see its current status.' using errcode='40001';
    end if;
  end if;

  update public.event_proposal set approval_status=decision where proposal_id=pid;
  insert into public.proposal_review(review_id,proposal_id,admin_id,review_decision,admin_remarks,reviewed_at)
  values('RV-'||substr(replace(gen_random_uuid()::text,'-',''),1,25),pid,reviewer_id,decision,clean_remarks,statement_timestamp());

  if decision='Approved' then
    new_event_id:='E-'||substr(replace(gen_random_uuid()::text,'-',''),1,24);
    insert into public.event(event_id,event_type_id,publication_status,registration_status,registration_capacity,
      starts_at,ends_at,org_id,event_status,proposal_id)
    values(new_event_id,proposal.event_type_id,'Unpublished','Closed',proposal.expected_count_attendees,
      primary_schedule.starts_at,primary_schedule.ends_at,proposal.org_id,'Upcoming',pid);
    if primary_schedule.venue_id is not null then
      insert into public.venue_booking(booking_id,event_id,venue_id,starts_at,ends_at,buffer_minutes,booking_status,authorized_by)
      values('B-'||substr(replace(gen_random_uuid()::text,'-',''),1,24),new_event_id,primary_schedule.venue_id,
        primary_schedule.starts_at,primary_schedule.ends_at,0,'Confirmed',reviewer_id);
    end if;
  end if;

  insert into public.notifications(recipient_user_id,event_id,proposal_id,notification_type,message)
  values(proposal.org_id,new_event_id,pid,'Proposal '||decision,
    proposal.event_name||': '||decision||case when clean_remarks is not null then E'\nAdmin remarks: '||clean_remarks else '' end);
exception when exclusion_violation then
  raise exception 'The primary venue is already booked for this time. Return the proposal for revisions.' using errcode='23P01';
end $$;
revoke all on function public.review_proposal(text,text,text) from public,anon;
grant execute on function public.review_proposal(text,text,text) to authenticated;

create or replace function private.guard_event() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if private.app_role()='Student Organization' then
    if (to_jsonb(new)-array['post_caption','publication_status','published_at','registration_status'])
      is distinct from (to_jsonb(old)-array['post_caption','publication_status','published_at','registration_status']) then
      raise exception 'Organizations may edit only publication, caption and registration visibility' using errcode='42501';
    end if;
  end if;
  if new.registration_status='Open' and new.publication_status<>'Published' then
    raise exception 'Publish the event before opening registration' using errcode='23514';
  end if;
  if TG_OP='UPDATE' then new.published_at:=old.published_at; else new.published_at:=null; end if;
  if new.publication_status='Published' and (TG_OP='INSERT' or old.publication_status is distinct from new.publication_status) then
    if not exists(select 1 from public.event_proposal p where p.proposal_id=new.proposal_id and p.org_id=new.org_id and p.approval_status='Approved') then
      raise exception 'Publishing requires an approved proposal owned by this organization' using errcode='42501';
    end if;
    new.published_at:=coalesce(new.published_at,statement_timestamp());
  end if;
  return new;
end $$;

comment on function public.review_proposal(text,text,text) is
  'Admin-only atomic pending review. Approval creates one unpublished event and reserves only its primary venue; decisions notify the submitting organization.';
