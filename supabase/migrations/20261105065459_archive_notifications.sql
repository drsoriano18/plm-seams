create or replace function private.notify_event_archived() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.archived_at is not null and old.archived_at is null then
    insert into public.notifications(recipient_user_id,event_id,notification_type,message)
    select new.org_id,new.event_id,'Event Archived','Event '||new.event_id||' has been archived.';
    insert into public.notifications(recipient_user_id,event_id,notification_type,message)
    select r.student_number,new.event_id,'Event Archived','The event has been archived.'
    from public.registration r where r.event_id=new.event_id and r.reg_status in ('Confirmed','Waitlisted');
  end if;
  return new;
end $$;
drop trigger if exists notify_event_archived on public.event;
create trigger notify_event_archived after update of archived_at on public.event
for each row execute function private.notify_event_archived();
revoke all on function private.notify_event_archived() from public,anon,authenticated;
