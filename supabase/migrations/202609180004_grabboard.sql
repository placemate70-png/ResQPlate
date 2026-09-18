begin;
create policy "Volunteers read available donations" on public.donations for select to authenticated
  using (status='available' and exists(select 1 from public.profiles where id=(select auth.uid()) and role='volunteer'));
create index donations_available_created_idx on public.donations(created_at) where status='available';
notify pgrst,'reload schema';
commit;
