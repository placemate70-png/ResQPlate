begin;
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null default auth.uid() references public.profiles(id),
  food_name text not null check (length(trim(food_name)) between 1 and 120),
  food_type text not null check (food_type in ('gravy','dry','rice')),
  description text not null default '' check (length(description) <= 1000),
  temperature_c numeric not null check (temperature_c between -20 and 100),
  quantity numeric not null check (quantity > 0),
  quantity_unit text not null check (quantity_unit in ('kg','litres','portions')),
  container text not null check (length(trim(container)) between 1 and 200),
  container_count integer not null check (container_count > 0),
  prepared_at timestamptz not null,
  created_at timestamptz not null default now(),
  status text not null default 'available' check (status in ('available','reserved','claimed')),
  check (prepared_at <= created_at)
);
create index donations_donor_created_idx on public.donations(donor_id,created_at desc);
alter table public.donations enable row level security;
revoke all on public.donations from public,anon,authenticated;
grant select on public.donations to authenticated;
grant insert(food_name,food_type,description,temperature_c,quantity,quantity_unit,container,container_count,prepared_at)
  on public.donations to authenticated;
create policy "Donor reads own donations" on public.donations for select to authenticated
  using (donor_id = (select auth.uid()) and exists (
    select 1 from public.profiles where id=(select auth.uid()) and role='donor'));
create policy "Donor creates own donations" on public.donations for insert to authenticated
  with check (donor_id=(select auth.uid()) and status='available' and exists (
    select 1 from public.profiles where id=(select auth.uid()) and role='donor'));
notify pgrst,'reload schema';
commit;
