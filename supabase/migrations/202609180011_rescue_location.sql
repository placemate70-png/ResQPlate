begin;
alter table public.rescues
 add column latest_volunteer_lat double precision,
 add column latest_volunteer_lng double precision,
 add column latest_location_at timestamptz,
 add constraint rescue_location_valid check ((latest_volunteer_lat is null and latest_volunteer_lng is null and latest_location_at is null) or
 (latest_volunteer_lat between -90 and 90 and latest_volunteer_lng between -180 and 180 and latest_location_at is not null));
alter table public.ngo_availability
 add column latitude double precision,
 add column longitude double precision,
 add constraint ngo_destination_valid check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180));
grant insert(latitude,longitude),update(latitude,longitude) on public.ngo_availability to authenticated;
create function public.record_rescue_location(donation_id uuid, latitude double precision, longitude double precision) returns public.rescues
language plpgsql security definer set search_path='' as $$
declare r public.rescues; t timestamptz:=clock_timestamp();
begin
 select * into r from public.rescues where rescues.donation_id=record_rescue_location.donation_id for update;
 if not found or r.volunteer_id is distinct from auth.uid() or not exists(select 1 from public.profiles where id=auth.uid() and role='volunteer') then raise exception 'Assigned volunteer required' using errcode='42501'; end if;
 if r.completed_at is not null then raise exception 'Rescue completed'; end if;
 if latitude is null or longitude is null or not (latitude between -90 and 90) or not (longitude between -180 and 180) then raise exception 'Invalid location'; end if;
 if r.latest_location_at is not null and r.latest_location_at>t-interval '15 seconds' then return r; end if;
 update public.rescues set latest_volunteer_lat=latitude,latest_volunteer_lng=longitude,latest_location_at=t where rescues.donation_id=r.donation_id returning * into r;
 return r;
end $$;
revoke all on function public.record_rescue_location(uuid,double precision,double precision) from public,anon;
grant execute on function public.record_rescue_location(uuid,double precision,double precision) to authenticated;
notify pgrst,'reload schema';
commit;
