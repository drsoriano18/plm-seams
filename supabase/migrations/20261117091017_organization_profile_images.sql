alter table public.student_organization add column profile_image_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('organization-profile-images','organization-profile-images',false,2097152,array['image/jpeg','image/png']);
create policy organization_photo_read on storage.objects for select to authenticated using (
 bucket_id='organization-profile-images' and (select private.app_role())='Student Organization' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy organization_photo_insert on storage.objects for insert to authenticated with check (
 bucket_id='organization-profile-images' and (select private.app_role())='Student Organization' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy organization_photo_delete on storage.objects for delete to authenticated using (
 bucket_id='organization-profile-images' and (select private.app_role())='Student Organization' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Only this narrowly scoped function can save an organization's own image path.
-- Keep general organization UPDATE permissions restricted to administrators.
create function private.set_organization_profile_image(path text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or private.app_role() is distinct from 'Student Organization' then
  raise exception 'Organization access required' using errcode='42501';
 end if;
 if path is null or split_part(path,'/',1) <> auth.uid()::text or not exists (
  select 1 from storage.objects where bucket_id='organization-profile-images' and name=path
 ) then raise exception 'Invalid organization profile image' using errcode='22023'; end if;
 update public.student_organization set profile_image_path=path where org_id=private.app_user_id();
 if not found then raise exception 'Organization not found' using errcode='22023'; end if;
end $$;
create function public.set_organization_profile_image(path text) returns void
language sql security invoker set search_path='' as $$ select private.set_organization_profile_image(path) $$;
revoke all on function private.set_organization_profile_image(text),public.set_organization_profile_image(text) from public,anon;
grant execute on function private.set_organization_profile_image(text),public.set_organization_profile_image(text) to authenticated;
