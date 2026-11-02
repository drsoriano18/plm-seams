-- Preserve existing business identifiers and sample records. Provision Auth separately.
alter table public.users add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
alter table public.users alter column password drop not null;
comment on column public.users.auth_user_id is 'Trusted link to Supabase Auth; never assigned from signup metadata or browser input.';
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.app_user_id() returns text language sql stable security definer set search_path = '' as $$
 select user_id::text from public.users where auth_user_id = (select auth.uid()) and (select auth.uid()) is not null
$$;
create function private.app_role() returns text language sql stable security definer set search_path = '' as $$
 select role::text from public.users where auth_user_id = (select auth.uid()) and (select auth.uid()) is not null
$$;
create function private.owns_proposal(pid text) returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce(private.app_role() = 'Student Organization' and exists(select 1 from public.event_proposal where proposal_id = pid and org_id = private.app_user_id()), false)
$$;
create function private.owns_event(eid text) returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce(private.app_role() = 'Student Organization' and exists(select 1 from public.event where event_id = eid and org_id = private.app_user_id()), false)
$$;
create function private.student_event_access(eid text) returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce(private.app_role() = 'Student' and exists(
 select 1 from public.event e join public.event_proposal p on p.proposal_id=e.proposal_id
 join public.students st on st.student_number=private.app_user_id()
 where e.event_id=eid and e.publication_status='Published'
 and (p.eligibility_mode='University-Wide' or (p.eligibility_mode='College-Specific' and p.allowed_college=st.college))), false)
$$;

-- Replace the reconstructed and live policies with one canonical definition.
do $$ declare p record; begin
 for p in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in
 ('users','students','student_organization','administrators','event_type','venue','event_proposal','proposal_schedule','proposal_review','event','registration','venue_booking','notifications') loop
 execute format('drop policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
 end loop;
end $$;
create or replace function public.get_my_role() returns text language sql stable security invoker set search_path='' as $$ select private.app_role() $$;
revoke all on function public.get_my_role() from public, anon;
grant execute on function public.get_my_role() to authenticated;
-- Remove broad legacy grants. RLS and explicit column privileges work together.
alter table public.users enable row level security;
revoke all on table public.users from anon, authenticated;
alter table public.students enable row level security;
revoke all on table public.students from anon, authenticated;
alter table public.student_organization enable row level security;
revoke all on table public.student_organization from anon, authenticated;
alter table public.administrators enable row level security;
revoke all on table public.administrators from anon, authenticated;
alter table public.event_type enable row level security;
revoke all on table public.event_type from anon, authenticated;
alter table public.venue enable row level security;
revoke all on table public.venue from anon, authenticated;
alter table public.event_proposal enable row level security;
revoke all on table public.event_proposal from anon, authenticated;
alter table public.proposal_schedule enable row level security;
revoke all on table public.proposal_schedule from anon, authenticated;
alter table public.proposal_review enable row level security;
revoke all on table public.proposal_review from anon, authenticated;
alter table public.event enable row level security;
revoke all on table public.event from anon, authenticated;
alter table public.registration enable row level security;
revoke all on table public.registration from anon, authenticated;
alter table public.venue_booking enable row level security;
revoke all on table public.venue_booking from anon, authenticated;
alter table public.notifications enable row level security;
revoke all on table public.notifications from anon, authenticated;
grant select (user_id, plm_email, role, created_at, auth_user_id) on public.users to authenticated;
grant select on public.students to authenticated;
grant select on public.student_organization to authenticated;
grant select on public.administrators to authenticated;
grant select on public.event_type to authenticated;
grant select on public.venue to authenticated;
grant select on public.event_proposal to authenticated;
grant select on public.proposal_schedule to authenticated;
grant select on public.proposal_review to authenticated;
grant select on public.event to authenticated;
grant select, delete on public.registration to authenticated;
grant select on public.venue_booking to authenticated;
grant select on public.notifications to authenticated;
grant insert, update, delete on public.students to authenticated;
grant insert, update, delete on public.student_organization to authenticated;
grant insert, update, delete on public.administrators to authenticated;
grant insert, update, delete on public.event_type to authenticated;
grant insert, update, delete on public.venue to authenticated;
grant insert, update, delete on public.event_proposal to authenticated;
grant insert, update, delete on public.proposal_schedule to authenticated;
grant insert, update, delete on public.proposal_review to authenticated;
grant insert, update, delete on public.event to authenticated;
grant insert, update, delete on public.venue_booking to authenticated;
grant insert, delete on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant usage on sequence public.notifications_notification_id_seq to authenticated;

-- Prevent an organization from moving/editing someone else's proposal through an UPDATE.
create function private.guard_proposal() returns trigger language plpgsql set search_path = '' as $$
begin
 if private.app_role()='Student Organization' then
  if new.org_id <> private.app_user_id() or new.approval_status <> 'Pending' then
   raise exception 'Organizations may only submit their own pending proposals' using errcode='42501';
  end if;
  if TG_OP='UPDATE' and (new.org_id is distinct from old.org_id or new.proposal_id is distinct from old.proposal_id) then
   raise exception 'Proposal identity cannot be changed' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
create trigger guard_proposal before insert or update on public.event_proposal for each row execute function private.guard_proposal();

-- Attendance is attributed exclusively to the event-owning student organization, per ERD.
alter table public.registration drop constraint registration_attendance_marked_by_fkey;
alter table public.registration add constraint registration_attendance_marked_by_fkey foreign key(attendance_marked_by) references public.student_organization(org_id);

create function private.register_event(eid text) returns text language plpgsql security definer set search_path = '' as $$
declare ev public.event%rowtype; rid text; status text;
begin
 if auth.uid() is null or private.app_role() is distinct from 'Student' then raise exception 'Student access required' using errcode='42501'; end if;
 select * into ev from public.event where event_id=eid for update;
 if not found or not private.student_event_access(eid) or ev.registration_status<>'Open' or ev.event_status<>'Upcoming' or ev.starts_at<=now() then
  raise exception 'Event is not open for registration' using errcode='42501';
 end if;
 if exists(select 1 from public.registration where event_id=eid and student_number=private.app_user_id() and reg_status<>'Cancelled') then
  raise exception 'You are already registered';
 end if;
 status := case when (select count(*) from public.registration where event_id=eid and reg_status='Confirmed') < ev.registration_capacity then 'Confirmed' else 'Waitlisted' end;
 rid := 'R-' || substr(replace(gen_random_uuid()::text,'-',''),1,26);
 insert into public.registration(reg_id,event_id,student_number,reg_status) values(rid,eid,private.app_user_id(),status)
 on conflict(event_id,student_number) do update set reg_status=excluded.reg_status,reg_date=now(),cancelled_at=null,cancellation_reason=null,attendance_status=null,attendance_marked_at=null,attendance_marked_by=null
 returning reg_id into rid;
 return rid;
end $$;
create function private.cancel_registration(rid text, reason text) returns void language plpgsql security definer set search_path = '' as $$
declare eid text; previous_status text;
begin
 if auth.uid() is null or private.app_role() is distinct from 'Student' then raise exception 'Student access required' using errcode='42501'; end if;
 select event_id into eid from public.registration where reg_id=rid and student_number=private.app_user_id();
 if eid is null then raise exception 'Registration not found' using errcode='42501'; end if;
 perform 1 from public.event where event_id=eid and starts_at>now() and event_status='Upcoming' for update;
 if not found then raise exception 'Cancellation is only available before the event starts' using errcode='42501'; end if;
 select reg_status into previous_status from public.registration where reg_id=rid for update;
 update public.registration set reg_status='Cancelled', cancelled_at=now(), cancellation_reason=reason,
 attendance_status=null,attendance_marked_at=null,attendance_marked_by=null
 where reg_id=rid and student_number=private.app_user_id() and reg_status<>'Cancelled';
 if previous_status='Confirmed' then
  update public.registration set reg_status='Confirmed' where reg_id=(
   select reg_id from public.registration where event_id=eid and reg_status='Waitlisted' order by reg_date,reg_id limit 1 for update);
 end if;
end $$;
create function private.mark_attendance(rid text, status text) returns void language plpgsql security definer set search_path = '' as $$
declare eid text;
begin
 if auth.uid() is null or status not in ('Present','Absent') or status is null then raise exception 'Invalid attendance request' using errcode='42501'; end if;
 select event_id into eid from public.registration where reg_id=rid and reg_status='Confirmed' for update;
 if eid is null or not private.owns_event(eid) then raise exception 'Access denied' using errcode='42501'; end if;
 update public.registration set attendance_status=status,attendance_marked_at=now(),attendance_marked_by=private.app_user_id() where reg_id=rid;
end $$;
-- Public RPC wrappers use invoker privileges. Privileged implementations stay unexposed.
create function public.register_event(eid text) returns text language sql security invoker set search_path='' as $$ select private.register_event(eid) $$;
create function public.cancel_registration(rid text, reason text default null) returns void language sql security invoker set search_path='' as $$ select private.cancel_registration(rid,reason) $$;
create function public.mark_attendance(rid text, status text) returns void language sql security invoker set search_path='' as $$ select private.mark_attendance(rid,status) $$;
revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
revoke all on function public.register_event(text), public.cancel_registration(text,text), public.mark_attendance(text,text) from public, anon;
grant execute on function public.register_event(text), public.cancel_registration(text,text), public.mark_attendance(text,text) to authenticated;

create index if not exists registration_student_event_idx on public.registration(student_number,event_id);
create index if not exists registration_event_status_idx on public.registration(event_id,reg_status);


create function private.guard_event() returns trigger language plpgsql set search_path='' as $$
begin
 if private.app_role()='Student Organization' then
  if (to_jsonb(new)-array['post_caption','publication_status','published_at','registration_status'])
    is distinct from (to_jsonb(old)-array['post_caption','publication_status','published_at','registration_status']) then
   raise exception 'Organizations may edit only publication, caption and registration visibility' using errcode='42501';
  end if;
 end if;
 if new.publication_status='Published' and (TG_OP='INSERT' or old.publication_status is distinct from new.publication_status) then
  if not exists(select 1 from public.event_proposal p where p.proposal_id=new.proposal_id and p.org_id=new.org_id and p.approval_status='Approved') then
   raise exception 'Publishing requires an approved proposal owned by this organization' using errcode='42501';
  end if;
  new.published_at := now();
 end if;
 return new;
end $$;
create trigger guard_event before insert or update on public.event for each row execute function private.guard_event();
-- Invoker trigger needs no extra table privileges; RLS remains in effect.
revoke all on function private.guard_event() from public, anon;
grant execute on function private.guard_event() to authenticated;

create function private.guard_review() returns trigger language plpgsql set search_path='' as $$
begin
 if private.app_role()='Admin' then
  if TG_OP='INSERT' then new.admin_id:=private.app_user_id(); new.reviewed_at:=now();
  elsif old.admin_id<>private.app_user_id() or new.admin_id<>old.admin_id or new.review_id<>old.review_id or new.proposal_id<>old.proposal_id then
   raise exception 'Review authorship cannot be changed' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
create trigger guard_review before insert or update on public.proposal_review for each row execute function private.guard_review();
revoke all on function private.guard_review() from public, anon;
grant execute on function private.guard_review() to authenticated;

create index if not exists idx_event_cancelled_by on public.event(cancelled_by);

create index if not exists idx_event_rescheduled_by on public.event(rescheduled_by);

create index if not exists idx_notifications_event_id on public.notifications(event_id);

create index if not exists idx_notifications_proposal_id on public.notifications(proposal_id);

create index if not exists idx_registration_attendance_marked_by on public.registration(attendance_marked_by);

create index if not exists idx_venue_booking_authorized_by on public.venue_booking(authorized_by);

-- Canonical policies: one per table and operation.
create policy rbac_delete on public.administrators for delete to authenticated using (((select private.app_role()) = 'Admin')) ;
create policy rbac_insert on public.administrators for insert to authenticated with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.administrators for select to authenticated using (((select private.app_role()) = 'Admin')) ;
create policy rbac_update on public.administrators for update to authenticated using (((select private.app_role()) = 'Admin')) with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_delete on public.event for delete to authenticated using (((select private.app_role()) = 'Admin')) ;
create policy rbac_insert on public.event for insert to authenticated with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.event for select to authenticated using (((select private.app_role()) = 'Admin') or (private.owns_event(event_id)) or (private.student_event_access(event_id))) ;
create policy rbac_update on public.event for update to authenticated using (((select private.app_role()) = 'Admin') or private.owns_event(event_id)) with check (((select private.app_role()) = 'Admin') or private.owns_event(event_id)) ;
create policy rbac_delete on public.event_proposal for delete to authenticated using (((select private.app_role()) = 'Admin') or (private.owns_proposal(proposal_id) and approval_status in ('Pending','Revisions Required'))) ;
create policy rbac_insert on public.event_proposal for insert to authenticated with check (((select private.app_role()) = 'Admin') or ((select private.app_role())='Student Organization' and org_id=(select private.app_user_id()) and approval_status='Pending')) ;
create policy rbac_select on public.event_proposal for select to authenticated using (((select private.app_role()) = 'Admin') or (private.owns_proposal(proposal_id))) ;
create policy rbac_update on public.event_proposal for update to authenticated using (((select private.app_role()) = 'Admin') or (private.owns_proposal(proposal_id) and approval_status in ('Pending','Revisions Required'))) with check (((select private.app_role()) = 'Admin') or (org_id=(select private.app_user_id()) and approval_status='Pending')) ;
create policy rbac_delete on public.event_type for delete to authenticated using (((select private.app_role()) = 'Admin')) ;
create policy rbac_insert on public.event_type for insert to authenticated with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.event_type for select to authenticated using (((select private.app_role()) = 'Admin') or ((select private.app_role()) is not null)) ;
create policy rbac_update on public.event_type for update to authenticated using (((select private.app_role()) = 'Admin')) with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_delete on public.notifications for delete to authenticated using ((recipient_user_id=(select private.app_user_id()))) ;
create policy rbac_insert on public.notifications for insert to authenticated with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.notifications for select to authenticated using ((recipient_user_id = (select private.app_user_id())) or (recipient_user_id=(select private.app_user_id()))) ;
create policy rbac_update on public.notifications for update to authenticated using ((recipient_user_id=(select private.app_user_id()))) with check ((recipient_user_id=(select private.app_user_id()))) ;
create policy rbac_delete on public.proposal_review for delete to authenticated using (((select private.app_role()) = 'Admin')) ;
create policy rbac_insert on public.proposal_review for insert to authenticated with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.proposal_review for select to authenticated using (((select private.app_role()) = 'Admin') or (private.owns_proposal(proposal_id))) ;
create policy rbac_update on public.proposal_review for update to authenticated using (((select private.app_role()) = 'Admin')) with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_delete on public.proposal_schedule for delete to authenticated using (((select private.app_role()) = 'Admin') or (private.owns_proposal(proposal_id) and exists(select 1 from public.event_proposal p where p.proposal_id=proposal_schedule.proposal_id and p.approval_status in ('Pending','Revisions Required')))) ;
create policy rbac_insert on public.proposal_schedule for insert to authenticated with check (((select private.app_role()) = 'Admin') or (private.owns_proposal(proposal_id) and exists(select 1 from public.event_proposal p where p.proposal_id=proposal_schedule.proposal_id and p.approval_status in ('Pending','Revisions Required')))) ;
create policy rbac_select on public.proposal_schedule for select to authenticated using (((select private.app_role()) = 'Admin') or (private.owns_proposal(proposal_id))) ;
create policy rbac_update on public.proposal_schedule for update to authenticated using (((select private.app_role()) = 'Admin') or (private.owns_proposal(proposal_id) and exists(select 1 from public.event_proposal p where p.proposal_id=proposal_schedule.proposal_id and p.approval_status in ('Pending','Revisions Required')))) with check (((select private.app_role()) = 'Admin') or (private.owns_proposal(proposal_id) and exists(select 1 from public.event_proposal p where p.proposal_id=proposal_schedule.proposal_id and p.approval_status in ('Pending','Revisions Required')))) ;
create policy rbac_delete on public.registration for delete to authenticated using (((select private.app_role())='Admin')) ;
create policy rbac_select on public.registration for select to authenticated using (((select private.app_role()) = 'Admin') or ((select private.app_role())='Student' and student_number=(select private.app_user_id())) or (private.owns_event(event_id))) ;
create policy rbac_delete on public.student_organization for delete to authenticated using (((select private.app_role()) = 'Admin')) ;
create policy rbac_insert on public.student_organization for insert to authenticated with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.student_organization for select to authenticated using (((select private.app_role()) = 'Admin') or (org_id=(select private.app_user_id()) and (select private.app_role())='Student Organization')) ;
create policy rbac_update on public.student_organization for update to authenticated using (((select private.app_role()) = 'Admin')) with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_delete on public.students for delete to authenticated using (((select private.app_role()) = 'Admin')) ;
create policy rbac_insert on public.students for insert to authenticated with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.students for select to authenticated using (((select private.app_role()) = 'Admin') or ((select private.app_role())='Student' and student_number=(select private.app_user_id())) or (exists(select 1 from public.registration r where r.student_number=students.student_number and private.owns_event(r.event_id)))) ;
create policy rbac_update on public.students for update to authenticated using (((select private.app_role()) = 'Admin')) with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.users for select to authenticated using (((select private.app_role()) = 'Admin') or (user_id = (select private.app_user_id()))) ;
create policy rbac_delete on public.venue for delete to authenticated using (((select private.app_role()) = 'Admin')) ;
create policy rbac_insert on public.venue for insert to authenticated with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.venue for select to authenticated using (((select private.app_role()) = 'Admin') or ((select private.app_role()) is not null)) ;
create policy rbac_update on public.venue for update to authenticated using (((select private.app_role()) = 'Admin')) with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_delete on public.venue_booking for delete to authenticated using (((select private.app_role()) = 'Admin')) ;
create policy rbac_insert on public.venue_booking for insert to authenticated with check (((select private.app_role()) = 'Admin')) ;
create policy rbac_select on public.venue_booking for select to authenticated using (((select private.app_role()) = 'Admin') or (private.owns_event(event_id))) ;
create policy rbac_update on public.venue_booking for update to authenticated using (((select private.app_role()) = 'Admin')) with check (((select private.app_role()) = 'Admin')) ;

-- Review history and proposal decision are committed together, using the caller's RLS.
create function public.review_proposal(pid text, decision text, remarks text default null) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if private.app_role() is distinct from 'Admin' or decision is null or decision not in ('Approved','Rejected','Revisions Required') then
  raise exception 'Administrator review required' using errcode='42501';
 end if;
 perform 1 from public.event_proposal where proposal_id=pid for update;
 if not found then raise exception 'Proposal not found'; end if;
 insert into public.proposal_review(review_id,proposal_id,admin_id,review_decision,admin_remarks,reviewed_at)
 values('RV-'||substr(replace(gen_random_uuid()::text,'-',''),1,25),pid,private.app_user_id(),decision,remarks,now());
 update public.event_proposal set approval_status=decision where proposal_id=pid;
end $$;
revoke all on function public.review_proposal(text,text,text) from public,anon;
grant execute on function public.review_proposal(text,text,text) to authenticated;
