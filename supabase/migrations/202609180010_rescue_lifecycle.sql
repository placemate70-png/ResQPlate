begin;
alter table public.rescues
 add column pickup_started_at timestamptz,
 add column delivery_started_at timestamptz,
 add column delivered_at timestamptz,
 add constraint rescue_pickup_start_order check(pickup_started_at is null or pickup_started_at>=assigned_at),
 add constraint rescue_delivery_start_order check(delivery_started_at is null or (picked_up_at is not null and delivery_started_at>=picked_up_at)),
 add constraint rescue_delivery_order check(delivered_at is null or (delivery_started_at is not null and delivered_at>=delivery_started_at));
create or replace function public.advance_rescue(donation_id uuid, action text, recipient uuid default null, plates integer default null) returns public.rescues
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
 elsif action in ('start_pickup','pickup','start_delivery','deliver') then
  if r.volunteer_id is distinct from actor or not exists(select 1 from public.profiles where id=actor and role='volunteer') then raise exception 'Assigned volunteer required' using errcode='42501'; end if;
  if action='start_pickup' then
   if r.pickup_started_at is not null then return r; end if;
   if r.picked_up_at is not null or r.completed_at is not null then raise exception 'Pickup already advanced'; end if;
   if d.freshness_expires_at<=t then raise exception 'Freshness deadline passed'; end if;
   update public.rescues set pickup_started_at=t where rescues.donation_id=d.id returning * into r;
  elsif action='start_delivery' then
   if r.delivery_started_at is not null then return r; end if;
   if r.picked_up_at is null or r.completed_at is not null then raise exception 'Pickup required'; end if;
   if d.freshness_expires_at<=t then raise exception 'Freshness deadline passed'; end if;
   update public.rescues set delivery_started_at=t where rescues.donation_id=d.id returning * into r;
  elsif action='deliver' then
   if r.delivered_at is not null then return r; end if;
   if r.delivery_started_at is null or r.completed_at is not null then raise exception 'Delivery start required'; end if;
   if d.freshness_expires_at<=t then raise exception 'Freshness deadline passed'; end if;
   update public.rescues set delivered_at=t where rescues.donation_id=d.id returning * into r;
  else
  if r.volunteer_id is distinct from actor then raise exception 'Assigned volunteer required' using errcode='42501'; end if;
  if r.picked_up_at is not null then return r; end if;
  if r.pickup_started_at is null then raise exception 'Start pickup first'; end if;
  if d.freshness_expires_at<=t then raise exception 'Freshness deadline passed'; end if;
  update public.rescues set picked_up_at=t where rescues.donation_id=d.id returning * into r;
 end if;
 elsif action='receive' then
  if r.ngo_id is distinct from actor or not exists(select 1 from public.profiles where id=actor and role='ngo') then raise exception 'Assigned NGO required' using errcode='42501'; end if;
  if r.completed_at is not null then return r; end if;
  if r.delivered_at is null or plates is null or plates<0 then raise exception 'Delivery and received plate count required'; end if;
  if d.freshness_expires_at<=t then raise exception 'Freshness deadline passed; do not receive expired food'; end if;
  update public.rescues set completed_at=t,delivered_plates=plates where rescues.donation_id=d.id returning * into r;
 else raise exception 'Unsupported action'; end if;
 return r;
end $$;
notify pgrst,'reload schema';
commit;
