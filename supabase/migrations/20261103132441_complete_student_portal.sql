-- Follow-up to the two recovered discovery migrations. Do not replay applied history.
alter table public.event_proposal add column allowed_programs text[] not null default '{}';
alter table public.event_proposal add constraint proposal_programs_valid check (
 array_position(allowed_programs,null) is null and
 (eligibility_mode <> 'Program-Specific' or cardinality(allowed_programs)>0));
alter table public.event_proposal add constraint proposal_eligibility_valid check (
 eligibility_mode in ('University-Wide','College-Specific','Program-Specific') and
 (eligibility_mode <> 'College-Specific' or nullif(btrim(allowed_college),'') is not null));
create or replace function private.student_event_access(eid text) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce(auth.uid() is not null and private.app_role()='Student' and exists(
 select 1 from public.event e join public.event_proposal p using(proposal_id)
 join public.students s on s.student_number=private.app_user_id()
 where e.event_id=eid and e.publication_status='Published'
 and (p.eligibility_mode='University-Wide'
 or (p.eligibility_mode='College-Specific' and p.allowed_college=s.college)
 or (p.eligibility_mode='Program-Specific' and s.program=any(p.allowed_programs)
 and (p.allowed_college is null or p.allowed_college=s.college)))
 and (cardinality(p.allowed_programs)=0 or s.program=any(p.allowed_programs))),false)
$$;
-- Deliberate, narrow definer read: students never receive raw proposal/booking access.
create function private.student_event_payload(eid text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'event_id',e.event_id,'event_name',p.event_name,'event_type',et.description,
 'organization_name',o.org_name,'event_description',p.description,'post_caption',e.post_caption,
 'eligible_college',case when p.eligibility_mode='University-Wide' then 'All Colleges' else p.allowed_college end,
 'eligibility_mode',p.eligibility_mode,'allowed_programs',p.allowed_programs,
 'starts_at',e.starts_at,'ends_at',e.ends_at,'published_at',e.published_at,
 'publication_status',e.publication_status,'event_status',e.event_status,'registration_status',e.registration_status,
 'registration_capacity',e.registration_capacity,
 'confirmed_registrations',(select count(*) from public.registration r where r.event_id=e.event_id and r.reg_status='Confirmed'),
 'waitlisted_registrations',(select count(*) from public.registration r where r.event_id=e.event_id and r.reg_status='Waitlisted'),
 'venue_name',v.venue_name,'building',v.building,'floor_number',v.floor_number,'room_number',v.room_number,'modality',et.modality,
 'student_reg_id',mine.reg_id,'student_reg_status',mine.reg_status,'student_cancelled_at',mine.cancelled_at,
 'student_attendance_status',mine.attendance_status,'student_reg_date',mine.reg_date,
 'can_register',private.student_event_access(e.event_id) and e.registration_status='Open' and e.event_status='Upcoming'
 and e.starts_at>statement_timestamp() and coalesce(mine.reg_status='Cancelled',true),
 'can_cancel',mine.reg_status in ('Confirmed','Waitlisted') and e.event_status='Upcoming' and e.starts_at>statement_timestamp())
 from public.event e join public.event_proposal p using(proposal_id)
 join public.event_type et on et.event_type_id=e.event_type_id
 join public.student_organization o on o.org_id=e.org_id
 left join lateral (select vb.venue_id from public.venue_booking vb where vb.event_id=e.event_id
 and vb.booking_status='Confirmed' order by vb.starts_at,vb.booking_id limit 1) booking on true
 left join public.venue v on v.venue_id=booking.venue_id
 left join public.registration mine on mine.event_id=e.event_id and mine.student_number=private.app_user_id()
 where e.event_id=eid and auth.uid() is not null and private.app_role()='Student'
 and (private.student_event_access(eid) or mine.reg_id is not null)
$$;
create function public.get_student_event_details(eid text) returns jsonb
language sql stable security invoker set search_path='' as $$ select private.student_event_payload(eid) $$;
create function private.student_event_feed(history boolean) returns setof jsonb
language sql stable security definer set search_path='' as $$
 select private.student_event_payload(e.event_id) from public.event e
 where auth.uid() is not null and private.app_role()='Student'
 and case when history then exists(select 1 from public.registration r where r.event_id=e.event_id and r.student_number=private.app_user_id())
 else private.student_event_access(e.event_id) and e.event_status in ('Upcoming','Ongoing') end
 order by e.starts_at,e.event_id
$$;
create function public.get_student_dashboard_events() returns setof jsonb
language sql stable security invoker set search_path='' as $$ select * from private.student_event_feed(false) $$;
create function public.get_student_registration_history() returns setof jsonb
language sql stable security invoker set search_path='' as $$ select * from private.student_event_feed(true) $$;
-- Keep the published discovery contract, but aggregate counts before selecting one venue.
create or replace function private.get_student_discover_events()
returns table(event_id varchar,event_name varchar,event_type varchar,organization_name varchar,
 eligible_college text,eligibility_mode varchar,starts_at timestamptz,ends_at timestamptz,
 venue_name varchar,registration_capacity integer,confirmed_registrations bigint)
language sql stable security definer set search_path='' as $$
 select e.event_id,p.event_name,t.description,o.org_name,
 case when p.eligibility_mode='University-Wide' then 'All Colleges' else p.allowed_college end,
 p.eligibility_mode,e.starts_at,e.ends_at,v.venue_name,e.registration_capacity,
 (select count(*) from public.registration r where r.event_id=e.event_id and r.reg_status='Confirmed')
 from public.event e join public.event_proposal p using(proposal_id)
 join public.event_type t on t.event_type_id=e.event_type_id join public.student_organization o on o.org_id=e.org_id
 left join lateral(select vb.venue_id from public.venue_booking vb where vb.event_id=e.event_id and vb.booking_status='Confirmed' order by vb.starts_at,vb.booking_id limit 1) b on true
 left join public.venue v using(venue_id)
 where private.student_event_access(e.event_id) and e.registration_status='Open' and e.event_status='Upcoming'
 and e.starts_at>statement_timestamp() order by e.starts_at,e.event_id
$$;
revoke all on function private.student_event_payload(text),private.student_event_feed(boolean),public.get_student_event_details(text),public.get_student_dashboard_events(),public.get_student_registration_history() from public,anon;
grant execute on function private.student_event_payload(text),private.student_event_feed(boolean),public.get_student_event_details(text),public.get_student_dashboard_events(),public.get_student_registration_history() to authenticated;
-- Extend the established atomic invoker RPC, preserving RLS and 15-day triggers.
create or replace function public.submit_proposal(proposal jsonb,schedule jsonb) returns text language plpgsql security invoker set search_path='' as $$
declare pid text:='P-'||substr(replace(gen_random_uuid()::text,'-',''),1,24);
begin
 if auth.uid() is null or private.app_role() is distinct from 'Student Organization' then raise exception 'Organization access required' using errcode='42501'; end if;
 insert into public.event_proposal(proposal_id,org_id,event_name,objectives,description,event_type_id,expected_count_attendees,eligibility_mode,allowed_college,allowed_programs,resource_requirements,budget_information,includes_sponsorship,collaborating_organization_text,approval_status,submission_date)
 values(pid,private.app_user_id(),proposal->>'event_name',proposal->>'objectives',proposal->>'description',proposal->>'event_type_id',
 (proposal->>'expected_count_attendees')::integer,proposal->>'eligibility_mode',nullif(proposal->>'allowed_college',''),
 array(select jsonb_array_elements_text(coalesce(proposal->'allowed_programs','[]'))),proposal->>'resource_requirements',proposal->>'budget_information',
 coalesce((proposal->>'includes_sponsorship')::boolean,false),proposal->>'collaborating_organization_text','Pending',statement_timestamp());
 insert into public.proposal_schedule(schedule_id,proposal_id,venue_id,starts_at,ends_at,schedule_type)
 values('S-'||substr(replace(gen_random_uuid()::text,'-',''),1,24),pid,nullif(schedule->>'venue_id',''),(schedule->>'starts_at')::timestamptz,(schedule->>'ends_at')::timestamptz,'Primary');
 return pid;
end $$;
notify pgrst,'reload schema';

-- Preserve the original publication date across publish toggles and client edits.
create or replace function private.guard_event() returns trigger language plpgsql set search_path='' as $$
begin
 if private.app_role()='Student Organization' then
  if (to_jsonb(new)-array['post_caption','publication_status','published_at','registration_status'])
    is distinct from (to_jsonb(old)-array['post_caption','publication_status','published_at','registration_status']) then
   raise exception 'Organizations may edit only publication, caption and registration visibility' using errcode='42501';
  end if;
 end if;
 if TG_OP='UPDATE' then new.published_at:=old.published_at; else new.published_at:=null; end if;
 if new.publication_status='Published' and (TG_OP='INSERT' or old.publication_status is distinct from new.publication_status) then
  if not exists(select 1 from public.event_proposal p where p.proposal_id=new.proposal_id and p.org_id=new.org_id and p.approval_status='Approved') then
   raise exception 'Publishing requires an approved proposal owned by this organization' using errcode='42501';
  end if;
  new.published_at := coalesce(new.published_at,statement_timestamp());
 end if;
 return new;
end $$;
