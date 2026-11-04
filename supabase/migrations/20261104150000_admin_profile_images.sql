alter table public.administrators add column if not exists profile_image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admin-profile-images', 'admin-profile-images', false, 2097152, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy admin_photo_read on storage.objects for select to authenticated using (
  bucket_id = 'admin-profile-images'
  and private.app_role() = 'Admin'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy admin_photo_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'admin-profile-images'
  and private.app_role() = 'Admin'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy admin_photo_delete on storage.objects for delete to authenticated using (
  bucket_id = 'admin-profile-images'
  and private.app_role() = 'Admin'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function private.set_admin_profile_image(path text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if private.app_role() <> 'Admin' then raise exception 'Only administrators can update an administrator profile image.' using errcode = '42501'; end if;
  if path is null or path !~ ('^' || (select auth.uid())::text || '/') then raise exception 'Invalid administrator profile image path.' using errcode = '22023'; end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'admin-profile-images' and o.name = path) then raise exception 'Administrator profile image was not uploaded.' using errcode = '22023'; end if;
  update public.administrators set profile_image_path = path where admin_id = private.app_user_id();
end;
$$;

create or replace function public.set_admin_profile_image(path text) returns void
language sql security invoker set search_path = '' as $$ select private.set_admin_profile_image(path) $$;
revoke all on function public.set_admin_profile_image(text), private.set_admin_profile_image(text) from public, anon;
grant execute on function public.set_admin_profile_image(text), private.set_admin_profile_image(text) to authenticated;
