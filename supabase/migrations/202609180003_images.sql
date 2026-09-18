begin;
alter table public.donations add column image_path text;
alter table public.donations add constraint donation_image_path_check
  check (image_path is null or image_path like donor_id::text || '/' || id::text || '/%');
grant update(image_path) on public.donations to authenticated;
create policy "Donor attaches own image" on public.donations for update to authenticated
  using (donor_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and role='donor'))
  with check (donor_id=(select auth.uid()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values ('food-images','food-images',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Donor uploads own donation image" on storage.objects for insert to authenticated
  with check (bucket_id='food-images' and (storage.foldername(name))[1]=(select auth.uid())::text
    and exists(select 1 from public.donations where id::text=(storage.foldername(name))[2] and donor_id=(select auth.uid())));
create policy "Read accessible donation images" on storage.objects for select to authenticated
  using (bucket_id='food-images' and exists(select 1 from public.donations where image_path=name));
create policy "Donor removes unattached upload" on storage.objects for delete to authenticated
  using (bucket_id='food-images' and (storage.foldername(name))[1]=(select auth.uid())::text
    and not exists(select 1 from public.donations where image_path=name));
notify pgrst,'reload schema';
commit;
