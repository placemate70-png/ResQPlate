begin;

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('donor', 'volunteer', 'ngo'))
);

alter table public.profiles enable row level security;

-- A user chooses a role once. Changing/deleting it is not a client operation.
revoke all on public.profiles from public, anon, authenticated;
grant select, insert on public.profiles to authenticated;

create policy "Read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "Create own profile" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

notify pgrst, 'reload schema';
commit;
