-- Visibility is independent of registration eligibility. Publish only the curated
-- student payload; keep private.student_event_access and registration RLS intact.
create or replace function private.student_event_payload(eid text) returns jsonb
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
 'is_eligible',private.student_event_access(e.event_id),
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
 and (e.publication_status='Published' or mine.reg_id is not null)
$$;
create or replace function private.student_event_feed(history boolean) returns setof jsonb
language sql stable security definer set search_path='' as $$
 select private.student_event_payload(e.event_id) from public.event e
 where auth.uid() is not null and private.app_role()='Student'
 and case when history then exists(select 1 from public.registration r where r.event_id=e.event_id and r.student_number=private.app_user_id())
 else e.publication_status='Published' and e.event_status in ('Upcoming','Ongoing') end
 order by e.starts_at,e.event_id
$$;
-- Replace the discovery contract atomically to add authoritative eligibility.
drop function public.get_student_discover_events();
drop function private.get_student_discover_events();
create function private.get_student_discover_events()
returns table(event_id varchar,event_name varchar,event_type varchar,organization_name varchar,
 eligible_college text,eligibility_mode varchar,starts_at timestamptz,ends_at timestamptz,
 venue_name varchar,registration_capacity integer,confirmed_registrations bigint,is_eligible boolean)
language sql stable security definer set search_path='' as $$
 select e.event_id,p.event_name,t.description,o.org_name,
 case when p.eligibility_mode='University-Wide' then 'All Colleges' else p.allowed_college end,
 p.eligibility_mode,e.starts_at,e.ends_at,v.venue_name,e.registration_capacity,
 (select count(*) from public.registration r where r.event_id=e.event_id and r.reg_status='Confirmed'),private.student_event_access(e.event_id)
 from public.event e join public.event_proposal p using(proposal_id)
 join public.event_type t on t.event_type_id=e.event_type_id join public.student_organization o on o.org_id=e.org_id
 left join lateral(select vb.venue_id from public.venue_booking vb where vb.event_id=e.event_id and vb.booking_status='Confirmed' order by vb.starts_at,vb.booking_id limit 1) b on true
 left join public.venue v using(venue_id)
 where auth.uid() is not null and private.app_role()='Student'
 and e.publication_status='Published' and e.event_status='Upcoming'
 and e.starts_at>statement_timestamp() order by e.starts_at,e.event_id
$$;
create function public.get_student_discover_events()
returns table(event_id varchar,event_name varchar,event_type varchar,organization_name varchar,
 eligible_college text,eligibility_mode varchar,starts_at timestamptz,ends_at timestamptz,
 venue_name varchar,registration_capacity integer,confirmed_registrations bigint,is_eligible boolean)
language sql stable security invoker set search_path='' as $$ select * from private.get_student_discover_events() $$;
revoke all on function private.get_student_discover_events(),public.get_student_discover_events() from public,anon;
grant execute on function private.get_student_discover_events(),public.get_student_discover_events() to authenticated;
notify pgrst, 'reload schema';
