begin;
create table public.ngo_availability (
  ngo_id uuid primary key default auth.uid() references public.profiles(id),
  status text not null check(status in ('accepting','closed','full')),
  updated_at timestamptz not null default now()
);
alter table public.ngo_availability enable row level security;
revoke all on public.ngo_availability from public,anon,authenticated;
grant select on public.ngo_availability to authenticated;
grant insert(ngo_id,status),update(ngo_id,status) on public.ngo_availability to authenticated;
create function public.stamp_availability() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at:=clock_timestamp(); return new; end $$;
create trigger availability_timestamp before insert or update on public.ngo_availability for each row execute function public.stamp_availability();
create policy availability_read on public.ngo_availability for select to authenticated using(exists(select 1 from public.profiles where id=auth.uid()));
create policy availability_insert on public.ngo_availability for insert to authenticated with check(ngo_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role='ngo'));
create policy availability_update on public.ngo_availability for update to authenticated using(ngo_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role='ngo')) with check(ngo_id=auth.uid());
create table public.rescues (
  donation_id uuid primary key references public.donations(id),
  volunteer_id uuid not null references public.profiles(id),
  ngo_id uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  picked_up_at timestamptz,
  completed_at timestamptz,
  delivered_plates integer check(delivered_plates>=0),
  check(completed_at is null or (picked_up_at is not null and delivered_plates is not null)),
  check(completed_at is null or completed_at>=picked_up_at),
  check(picked_up_at is null or picked_up_at>=assigned_at)
);
alter table public.rescues enable row level security;
revoke all on public.rescues from public,anon,authenticated;
grant select on public.rescues to authenticated;
create policy rescue_read on public.rescues for select to authenticated using(volunteer_id=auth.uid() or ngo_id=auth.uid() or exists(select 1 from public.donations d where d.id=donation_id and d.donor_id=auth.uid()));
create function public.advance_rescue(donation_id uuid, action text, recipient uuid default null, plates integer default null) returns public.rescues
language plpgsql security definer set search_path='' as $$
declare d public.donations; r public.rescues; actor uuid:=auth.uid(); t timestamptz;
begin
 select * into d from public.donations where id=donation_id for update;
 if not found or actor is null then raise exception 'Donation unavailable' using errcode='42501'; end if;
 t:=clock_timestamp();
 select * into r from public.rescues where rescues.donation_id=d.id for update;
 if action='assign' then
  if d.status<>'claimed' or d.reserved_by<>actor or not exists(select 1 from public.profiles where id=actor and role='volunteer') then raise exception 'Confirmed owner required' using errcode='42501'; end if;
  if r.donation_id is not null then return r; end if;
  if d.freshness_expires_at<=t then raise exception 'Freshness deadline passed'; end if;
  perform 1 from public.ngo_availability a join public.profiles p on p.id=a.ngo_id where a.ngo_id=recipient and a.status='accepting' and p.role='ngo' for update of a;
  if not found then raise exception 'NGO is not accepting'; end if;
  insert into public.rescues(donation_id,volunteer_id,ngo_id,assigned_at) values(d.id,actor,recipient,t) returning * into r;
 elsif action='pickup' then
  if r.volunteer_id is distinct from actor then raise exception 'Assigned volunteer required' using errcode='42501'; end if;
  if r.picked_up_at is not null then return r; end if;
  if d.freshness_expires_at<=t then raise exception 'Freshness deadline passed'; end if;
  update public.rescues set picked_up_at=t where rescues.donation_id=d.id returning * into r;
 elsif action='receive' then
  if r.ngo_id is distinct from actor then raise exception 'Assigned NGO required' using errcode='42501'; end if;
  if r.completed_at is not null then return r; end if;
  if r.picked_up_at is null or plates is null or plates<0 then raise exception 'Pickup and received plate count required'; end if;
  if d.freshness_expires_at<=t then raise exception 'Freshness deadline passed; do not receive expired food'; end if;
  update public.rescues set completed_at=t,delivered_plates=plates where rescues.donation_id=d.id returning * into r;
 else raise exception 'Unsupported action'; end if;
 return r;
end $$;
revoke all on function public.advance_rescue(uuid,text,uuid,integer) from public,anon;
grant execute on function public.advance_rescue(uuid,text,uuid,integer) to authenticated;
create function public.impact_feed() returns table(donation_id uuid,food_name text,completed_at timestamptz,delivered_plates integer)
language sql security definer set search_path='' as $$
 select d.id,d.food_name,r.completed_at,r.delivered_plates from public.rescues r join public.donations d on d.id=r.donation_id
 where r.completed_at is not null and exists(select 1 from public.profiles where id=auth.uid()) order by r.completed_at desc limit 50;
$$;
revoke all on function public.impact_feed() from public,anon;
grant execute on function public.impact_feed() to authenticated;
notify pgrst,'reload schema';
commit;
