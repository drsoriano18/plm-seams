-- Private student photos; paths are stable references, never expiring URLs.
alter table public.students add column profile_image_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('student-profile-images','student-profile-images',false,2097152,array['image/jpeg','image/png']);
create policy student_photo_read on storage.objects for select to authenticated using(
 bucket_id='student-profile-images' and private.app_role()='Student' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy student_photo_insert on storage.objects for insert to authenticated with check(
 bucket_id='student-profile-images' and private.app_role()='Student' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy student_photo_delete on storage.objects for delete to authenticated using(
 bucket_id='student-profile-images' and private.app_role()='Student' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Replacement uses a new immutable object, then switches the profile reference.
create function private.set_student_profile_image(path text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or private.app_role() is distinct from 'Student' then raise exception 'Student access required' using errcode='42501'; end if;
 if path is not null and (split_part(path,'/',1)<>auth.uid()::text or not exists(
 select 1 from storage.objects o where o.bucket_id='student-profile-images' and o.name=path)) then
 raise exception 'Upload your own image before saving it' using errcode='42501'; end if;
 update public.students set profile_image_path=path where student_number=private.app_user_id();
 if not found then raise exception 'Student profile not found' using errcode='42501'; end if;
end $$;
create function public.set_student_profile_image(path text) returns void language sql security invoker set search_path='' as $$ select private.set_student_profile_image(path) $$;
revoke all on function public.set_student_profile_image(text),private.set_student_profile_image(text) from public,anon;
grant execute on function public.set_student_profile_image(text),private.set_student_profile_image(text) to authenticated;
notify pgrst,'reload schema';
