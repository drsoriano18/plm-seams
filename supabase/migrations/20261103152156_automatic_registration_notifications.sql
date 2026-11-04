-- Notifications are generated in the same transaction as each registration transition.
-- This private trigger is not an RPC; clients retain recipient-only SELECT/update RLS.
create function private.notify_registration_status() returns trigger
language plpgsql security definer set search_path = '' as $$
declare title text; body text; event_name text;
begin
 if TG_OP='UPDATE' and new.reg_status is not distinct from old.reg_status then return new; end if;
 select p.event_name into event_name from public.event e join public.event_proposal p on p.proposal_id=e.proposal_id where e.event_id=new.event_id;
 event_name:=coalesce(event_name,new.event_id);
 if new.reg_status='Confirmed' then
  if TG_OP='UPDATE' and old.reg_status='Waitlisted' then
   title:='Slot Confirmed'; body:='A slot is now available. Your registration for '||event_name||' is confirmed.';
  else title:='Registration Confirmed'; body:='Your registration for '||event_name||' is confirmed.'; end if;
 elsif new.reg_status='Waitlisted' then
  title:='Added to Waitlist'; body:='You are on the waitlist for '||event_name||'. We will notify you when a slot becomes available.';
 elsif new.reg_status='Cancelled' and TG_OP='UPDATE' then
  title:='Registration Cancelled'; body:='Your registration for '||event_name||' has been cancelled.';
 else return new;
 end if;
 insert into public.notifications(recipient_user_id,event_id,notification_type,message,created_at)
 values(new.student_number,new.event_id,title,body,statement_timestamp());
 return new;
end $$;
revoke all on function private.notify_registration_status() from public,anon,authenticated;
create trigger registration_status_notification after insert or update of reg_status on public.registration
for each row execute function private.notify_registration_status();

-- Owner-requested refresh of old demo registration notices after the sample event
-- reschedule. Do not change registration dates or unrelated historical notifications.
update public.notifications n set created_at=statement_timestamp(),read_at=null
where n.created_at < '2026-11-03 00:00:00+08'::timestamptz
 and n.notification_type in ('Registration Confirmed','Registration Waitlisted','Added to Waitlist')
 and exists(select 1 from public.registration r join public.event e on e.event_id=r.event_id
 where r.student_number=n.recipient_user_id and r.event_id=n.event_id
 and e.event_id like 'EV-2026-%' and e.event_status='Upcoming' and e.starts_at>statement_timestamp()
 and ((n.notification_type='Registration Confirmed' and r.reg_status='Confirmed')
 or (n.notification_type in ('Registration Waitlisted','Added to Waitlist') and r.reg_status='Waitlisted')));
