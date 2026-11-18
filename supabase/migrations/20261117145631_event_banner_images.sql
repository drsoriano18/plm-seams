alter table public.event add column banner_image_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('event-banners','event-banners',false,2097152,array['image/jpeg','image/png']);
create policy event_banner_read on storage.objects for select to authenticated using (
 bucket_id='event-banners' and exists(select 1 from public.event e where e.banner_image_path=name)
);
create policy event_banner_insert on storage.objects for insert to authenticated with check (
 bucket_id='event-banners' and (select private.app_role())='Student Organization'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.event e where e.event_id=(storage.foldername(name))[2]
 and e.org_id=(select private.app_user_id()) and e.archived_at is null)
);
-- Owners may read uploaded objects before the event reference is saved.
create policy event_banner_owner_read on storage.objects for select to authenticated using (
 bucket_id='event-banners' and (select private.app_role())='Student Organization'
 and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy event_banner_delete on storage.objects for delete to authenticated using (
 bucket_id='event-banners' and (select private.app_role())='Student Organization'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and not exists(select 1 from public.event e where e.banner_image_path=name)
);
create function private.validate_event_banner() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' and new.banner_image_path is not distinct from old.banner_image_path then return new; end if;
 if TG_OP='INSERT' and new.banner_image_path is null then return new; end if;
 if auth.uid() is null or private.app_role() is distinct from 'Student Organization'
 or new.org_id is distinct from private.app_user_id() or new.archived_at is not null then
 raise exception 'Only the owning organization can change this banner' using errcode='42501'; end if;
 if new.banner_image_path is null or split_part(new.banner_image_path,'/',1)<>auth.uid()::text
 or split_part(new.banner_image_path,'/',2)<>new.event_id
 or not exists(select 1 from storage.objects where bucket_id='event-banners' and name=new.banner_image_path) then
 raise exception 'Upload a valid banner for this event first' using errcode='22023'; end if;
 return new;
end $$;
create trigger validate_event_banner before insert or update on public.event for each row execute function private.validate_event_banner();
revoke all on function private.validate_event_banner() from public,anon,authenticated;
create function public.set_event_banner(eid text,path text) returns text language plpgsql security invoker set search_path='' as $$
declare previous text;
begin
 if auth.uid() is null or private.app_role() is distinct from 'Student Organization' then
 raise exception 'Organization access required' using errcode='42501'; end if;
 select banner_image_path into previous from public.event where event_id=eid and org_id=private.app_user_id() and archived_at is null for update;
 if not found then raise exception 'Event not available for banner upload' using errcode='42501'; end if;
 update public.event set banner_image_path=path where event_id=eid;
 return previous;
end $$;
revoke all on function public.set_event_banner(text,text) from public,anon;
grant execute on function public.set_event_banner(text,text) to authenticated;

create or replace function private.guard_event() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  -- A banner-only update keeps every other event field unchanged.
  -- The dedicated banner trigger validates ownership and the stored object.
  if TG_OP='UPDATE' and private.app_role()='Student Organization'
     and old.org_id=private.app_user_id() and old.archived_at is null
     and (to_jsonb(new)-'banner_image_path') is not distinct from (to_jsonb(old)-'banner_image_path') then
    return new;
  end if;
  if coalesce(current_setting('seams.archive_event',true),'off')='on' then
    if new.event_id is distinct from old.event_id or new.event_status is distinct from old.event_status
       or new.archived_at is null or new.archived_at < old.archived_at then
      raise exception 'Archive operation may only set archived_at' using errcode='42501';
    end if;
    return new;
  end if;
  -- Publication timestamps are server-owned and retain the first publish time.
  if new.publication_status = 'Published'
     and (TG_OP = 'INSERT' or old.publication_status is distinct from 'Published') then
    if not exists (
      select 1 from public.event_proposal p
      where p.proposal_id = new.proposal_id and p.org_id = new.org_id
        and p.approval_status = 'Approved'
    ) then
      raise exception 'Publishing requires an approved proposal owned by this organization'
        using errcode = '42501';
    end if;
    if TG_OP = 'INSERT' then
      new.published_at := statement_timestamp();
    else
      new.published_at := coalesce(old.published_at, statement_timestamp());
    end if;
  elsif TG_OP = 'UPDATE' then
    new.published_at := old.published_at;
  else
    new.published_at := null;
  end if;

  if private.app_role()='Student Organization' then
    -- Allow only due lifecycle transitions on the caller's own event.
    -- No client-set session flag or general status-edit permission is used.
    if TG_OP = 'UPDATE'
       and old.org_id = private.app_user_id()
       and old.archived_at is null
       and new.registration_status = 'Closed'
       and (to_jsonb(new) - array['event_status','registration_status','completed_at'])
           is not distinct from
           (to_jsonb(old) - array['event_status','registration_status','completed_at'])
       and (
         (old.event_status = 'Upcoming'
          and new.event_status = 'Ongoing'
          and old.starts_at <= statement_timestamp()
          and old.ends_at > statement_timestamp()
          and new.completed_at is not distinct from old.completed_at)
         or
         (old.event_status in ('Upcoming','Ongoing')
          and new.event_status = 'Completed'
          and old.ends_at <= statement_timestamp()
          and new.completed_at is not distinct from
              coalesce(old.completed_at, statement_timestamp()))
       )
    then
      return new;
    end if;
    if (to_jsonb(new)-array['post_caption','publication_status','published_at','registration_status'])
       is distinct from (to_jsonb(old)-array['post_caption','publication_status','published_at','registration_status']) then
      raise exception 'Organizations may edit only publication, caption and registration visibility' using errcode='42501';
    end if;
    if new.event_status in ('Completed','Cancelled') and new.publication_status='Published' then
      raise exception 'Completed or cancelled events cannot be published' using errcode='23514';
    end if;
    if new.event_status in ('Completed','Cancelled') and new.registration_status='Open' then
      raise exception 'Completed or cancelled events cannot accept registrations' using errcode='23514';
    end if;
  end if;
  if new.registration_status='Open' and new.publication_status<>'Published' then
    raise exception 'Publish the event before opening registration' using errcode='23514';
  end if;
  return new;
end $$;
