-- Secure read-only event feed for the authenticated Student Discover page.
-- This does not change tables or existing RLS policies. The function only
-- returns future, published, open events the current student may access.
create or replace function public.get_student_discover_events()
returns table (
  event_id varchar(30),
  event_name varchar(200),
  event_type varchar(100),
  organization_name varchar(200),
  eligible_college text,
  eligibility_mode varchar(50),
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name varchar(200),
  registration_capacity integer,
  confirmed_registrations bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.event_id,
    p.event_name,
    et.description as event_type,
    o.org_name as organization_name,
    case when p.eligibility_mode = 'University-Wide' then 'All Colleges' else p.allowed_college end as eligible_college,
    p.eligibility_mode,
    e.starts_at,
    e.ends_at,
    v.venue_name,
    e.registration_capacity,
    count(r.reg_id) filter (where r.reg_status = 'Confirmed') as confirmed_registrations
  from public.event e
  join public.event_proposal p on p.proposal_id = e.proposal_id
  join public.event_type et on et.event_type_id = e.event_type_id
  join public.student_organization o on o.org_id = e.org_id
  left join public.venue_booking vb on vb.event_id = e.event_id and vb.booking_status = 'Confirmed'
  left join public.venue v on v.venue_id = vb.venue_id
  left join public.registration r on r.event_id = e.event_id
  where (select auth.uid()) is not null
    and private.app_role() = 'Student'
    and private.student_event_access(e.event_id)
    and e.publication_status = 'Published'
    and e.registration_status = 'Open'
    and e.event_status = 'Upcoming'
    and e.starts_at > now()
  group by e.event_id, p.event_name, et.description, o.org_name, p.eligibility_mode,
    p.allowed_college, e.starts_at, e.ends_at, v.venue_name, e.registration_capacity
  order by e.starts_at asc;
$$;

revoke all on function public.get_student_discover_events() from public, anon;
grant execute on function public.get_student_discover_events() to authenticated;
