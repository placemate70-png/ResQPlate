begin;
-- Shared food records contain no donor/volunteer email or private profile fields.
create policy "NGOs read shared donation information" on public.donations for select to authenticated
  using (exists(select 1 from public.profiles where id=(select auth.uid()) and role='ngo'));
notify pgrst,'reload schema';
commit;
