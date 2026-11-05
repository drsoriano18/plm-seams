-- Objective SRS rules that do not require frontend changes.
alter table public.registration add column if not exists waitlist_position integer;
alter table public.registration add column if not exists registration_source varchar(30) not null default 'Web Portal';
alter table public.registration add constraint registration_waitlist_position_check
  check (waitlist_position is null or waitlist_position > 0);

create or replace function private.recompute_waitlist_positions(eid text) returns void
language plpgsql security definer set search_path='' as $$
begin
  with ranked as (
    select reg_id,row_number() over(order by reg_date,reg_id)::integer as position
    from public.registration where event_id=eid and reg_status='Waitlisted'
  )
  update public.registration r set waitlist_position=ranked.position
  from ranked where r.reg_id=ranked.reg_id;
  update public.registration set waitlist_position=null
  where event_id=eid and reg_status<>'Waitlisted';
end $$;

create or replace function private.registration_waitlist_positions() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform private.recompute_waitlist_positions(coalesce(new.event_id,old.event_id));
  if TG_OP='UPDATE' and new.event_id is distinct from old.event_id then
    perform private.recompute_waitlist_positions(old.event_id);
  end if;
  return coalesce(new,old);
end $$;
drop trigger if exists registration_waitlist_positions on public.registration;
create trigger registration_waitlist_positions after insert or update of reg_status,reg_date or delete on public.registration
for each row execute function private.registration_waitlist_positions();
update public.registration r set registration_source=coalesce(registration_source,'Web Portal');
do $$ declare e text; begin for e in select distinct event_id from public.registration loop perform private.recompute_waitlist_positions(e); end loop; end $$;

create or replace function private.check_proposal_venue_capacity() returns trigger
language plpgsql security definer set search_path='' as $$
declare expected integer; maximum integer;
begin
  if new.venue_id is null then return new; end if;
  select expected_count_attendees into expected from public.event_proposal where proposal_id=new.proposal_id;
  select max_capacity into maximum from public.venue where venue_id=new.venue_id;
  if maximum is not null and coalesce(expected,0) > maximum then
    raise exception 'Expected attendees exceed the selected venue capacity' using errcode='22023';
  end if;
  return new;
end $$;
drop trigger if exists proposal_venue_capacity on public.proposal_schedule;
create trigger proposal_venue_capacity before insert or update of venue_id,proposal_id on public.proposal_schedule
for each row execute function private.check_proposal_venue_capacity();

create or replace function private.refresh_event_states_system() returns integer
language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
  update public.event set event_status='Completed',completed_at=coalesce(completed_at,statement_timestamp())
  where event_status in ('Upcoming','Ongoing') and ends_at<=statement_timestamp();
  get diagnostics changed=row_count;
  update public.event set event_status='Ongoing'
  where event_status='Upcoming' and starts_at<=statement_timestamp() and ends_at>statement_timestamp();
  return changed;
end $$;
revoke all on function private.refresh_event_states_system() from public,anon,authenticated;

notify pgrst,'reload schema';
