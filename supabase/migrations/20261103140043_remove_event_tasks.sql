begin;

-- Retire the unused task feature without deleting event or proposal schedules.
lock table public.event_task in access exclusive mode;
do $$ begin
 if exists(select 1 from public.event_task) then
  raise exception 'Task table is no longer empty; export and review records before removal';
 end if;
end $$;
drop function public.save_event_task(jsonb);
drop table public.event_task restrict;
drop function private.guard_event_task();

commit;
