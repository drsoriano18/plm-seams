create table public.event_task(
 task_id uuid primary key default gen_random_uuid(),
 event_id varchar(30) not null references public.event(event_id),
 parent_task_id uuid,
 title text not null check(length(btrim(title)) between 1 and 200),
 description text,
 starts_at timestamptz,
 due_at timestamptz not null,
 status text not null default 'Pending' check(status in ('Pending','In Progress','Completed')),
 created_at timestamptz not null default now(),
 unique(task_id,event_id),
 foreign key(parent_task_id,event_id) references public.event_task(task_id,event_id),
 check(parent_task_id is distinct from task_id),
 check(starts_at is null or due_at>=starts_at)
);
create index event_task_event_idx on public.event_task(event_id);
create index event_task_parent_idx on public.event_task(parent_task_id,event_id);
alter table public.event_task enable row level security;
revoke all on public.event_task from public,anon,authenticated;
grant select,insert,update,delete on public.event_task to authenticated;
create policy task_access on public.event_task for all to authenticated
 using(private.app_role()='Admin' or private.owns_event(event_id))
 with check(private.app_role()='Admin' or private.owns_event(event_id));
create function private.guard_event_task() returns trigger language plpgsql set search_path='' as $$
declare parent public.event_task%rowtype;
begin
 -- Serializes edits within an event so concurrent parent/child dates cannot conflict.
 perform 1 from public.event where event_id=new.event_id for update;
 if TG_OP='UPDATE' and (new.task_id is distinct from old.task_id or new.event_id is distinct from old.event_id or new.parent_task_id is distinct from old.parent_task_id) then
 raise exception 'Task identity and parent cannot be changed' using errcode='23514'; end if;
 if new.parent_task_id is not null then
 select * into parent from public.event_task where task_id=new.parent_task_id and event_id=new.event_id;
 if not found or new.due_at>parent.due_at or (parent.starts_at is not null and (new.starts_at is null or new.starts_at<parent.starts_at)) then
 raise exception 'Subtask dates must fit inside the parent task dates' using errcode='23514'; end if;
 end if;
 if exists(select 1 from public.event_task c where c.parent_task_id=new.task_id and
 (c.due_at>new.due_at or (new.starts_at is not null and (c.starts_at is null or c.starts_at<new.starts_at)))) then
 raise exception 'Task dates must contain existing subtasks' using errcode='23514'; end if;
 return new;
end $$;
create trigger guard_event_task before insert or update on public.event_task for each row execute function private.guard_event_task();
revoke all on function private.guard_event_task() from public,anon,authenticated;
create function public.save_event_task(task jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare tid uuid:=coalesce(nullif(task->>'task_id','')::uuid,gen_random_uuid());
begin
 if (private.app_role() is distinct from 'Student Organization' and private.app_role() is distinct from 'Admin') or auth.uid() is null then raise exception 'Organization or Admin access required' using errcode='42501'; end if;
 if task->>'task_id' is null then
 insert into public.event_task(task_id,event_id,parent_task_id,title,description,starts_at,due_at,status)
 values(tid,task->>'event_id',nullif(task->>'parent_task_id','')::uuid,task->>'title',task->>'description',nullif(task->>'starts_at','')::timestamptz,(task->>'due_at')::timestamptz,coalesce(task->>'status','Pending'));
 else
 update public.event_task set title=task->>'title',description=task->>'description',starts_at=nullif(task->>'starts_at','')::timestamptz,due_at=(task->>'due_at')::timestamptz,status=task->>'status' where task_id=tid;
 if not found then raise exception 'Task not accessible' using errcode='42501'; end if;
 end if;
 return tid;
end $$;
revoke all on function public.save_event_task(jsonb) from public,anon;
grant execute on function public.save_event_task(jsonb) to authenticated;
notify pgrst,'reload schema';
