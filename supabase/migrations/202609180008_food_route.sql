begin;
alter table public.donations
  add column freshness_expires_at timestamptz,
  add column estimated_plates integer check (estimated_plates >= 0),
  add column corrected_plates integer check (corrected_plates >= 0),
  add column capacity_litres numeric check (capacity_litres > 0),
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180),
  add column route_state text not null default 'released' check (route_state in ('holding','released')),
  add column release_at timestamptz,
  add column route_batch_id uuid;
alter table public.donations add constraint coordinates_pair check ((latitude is null)=(longitude is null));

create function public.set_food_metrics() returns trigger language plpgsql set search_path='' as $$
begin
  new.freshness_expires_at := new.prepared_at + make_interval(secs =>
    ((case when new.food_type='gravy' then 1.5 else 4 end) + (case when new.temperature_c<30 then 1 else 0 end))*3600);
  new.estimated_plates := floor(case when new.quantity_unit='portions' then new.quantity else new.quantity/0.3 end);
  if new.quantity_unit='litres' and new.capacity_litres is not null and new.quantity>new.container_count*new.capacity_litres then
    raise exception 'Quantity exceeds container capacity' using errcode='23514';
  end if;
  if TG_OP='INSERT' then
    new.route_state := 'holding';
    new.release_at := new.created_at+interval '180 seconds';
  end if;
  return new;
end $$;
create trigger food_metrics before insert or update of prepared_at,food_type,temperature_c,quantity,quantity_unit,container_count,capacity_litres
  on public.donations for each row execute function public.set_food_metrics();
update public.donations set quantity=quantity;
alter table public.donations alter column freshness_expires_at set not null;
alter table public.donations alter column estimated_plates set not null;
grant insert(capacity_litres,latitude,longitude,corrected_plates),update(corrected_plates) on public.donations to authenticated;

-- All geographic matching uses this one database function (great-circle distance).
create function public.distance_km(lat1 double precision,lon1 double precision,lat2 double precision,lon2 double precision)
returns double precision language sql immutable strict set search_path='' as $$
  select 6371.0088*2*asin(sqrt(least(1.0,
    power(sin(radians(lat2-lat1)/2),2)+cos(radians(lat1))*cos(radians(lat2))*power(sin(radians(lon2-lon1)/2),2))));
$$;

create function public.release_route_donations() returns void
language plpgsql security definer set search_path='' as $$
declare anchor public.donations; candidate public.donations; members uuid[]; batch uuid;
begin
  if not pg_try_advisory_xact_lock(1801500) then return; end if;
  for anchor in select * from public.donations where route_state='holding' and release_at<=clock_timestamp() order by created_at,id for update loop
    if not exists(select 1 from public.donations where id=anchor.id and route_state='holding') then continue; end if;
    if anchor.route_batch_id is not null then
      update public.donations set route_state='released' where id=anchor.id;
      continue;
    end if;
    members := array[anchor.id];
    if anchor.latitude is not null and anchor.freshness_expires_at>clock_timestamp() then
      for candidate in select * from public.donations where route_state='holding' and status='available' and route_batch_id is null
        and freshness_expires_at>clock_timestamp() and food_type=anchor.food_type
        and id<>anchor.id and latitude is not null order by created_at,id for update loop
        -- Require every pair within 1.5 km, preventing long chains of neighbours.
        if not exists(select 1 from public.donations d where d.id=any(members)
          and public.distance_km(d.latitude,d.longitude,candidate.latitude,candidate.longitude)>1.5) then
          members := array_append(members,candidate.id);
        end if;
      end loop;
    end if;
    batch := case when cardinality(members)>1 then gen_random_uuid() else null end;
    -- Pending neighbours can join a batch, but each still serves its full hold.
    update public.donations set route_state=case when release_at<=clock_timestamp() then 'released' else 'holding' end,
      route_batch_id=batch where id=any(members);
  end loop;
end $$;
revoke all on function public.release_route_donations() from public,anon,authenticated;
select cron.schedule('resqplate-route-release','1 second','select public.release_route_donations()');

-- Keep the existing atomic reservation code, add a server-enforced release gate.
create function public.require_route_release() returns trigger language plpgsql set search_path='' as $$
begin
  if new.status='reserved' and old.status='available' and old.route_state<>'released' then
    raise exception 'Donation is still in the 180-second RouteBuddy hold' using errcode='23514';
  end if;
  return new;
end $$;
create trigger route_reservation_gate before update of status on public.donations
  for each row execute function public.require_route_release();
alter policy "Volunteers read available donations" on public.donations using (
  exists(select 1 from public.profiles where id=(select auth.uid()) and role='volunteer')
  and ((status='available' and route_state='released') or reserved_by=(select auth.uid())));
create or replace function public.grabboard_state() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not exists(select 1 from public.profiles where id=actor and role='volunteer') then
    raise exception 'Volunteer role required' using errcode='42501';
  end if;
  perform public.expire_reservations();
  return jsonb_build_object(
    'available',coalesce((select jsonb_agg(to_jsonb(d) order by created_at) from public.donations d
      where status='available' and route_state='released'),'[]'::jsonb),
    'reservations',coalesce((select jsonb_agg(to_jsonb(d) order by reserved_at desc) from public.donations d
      where reserved_by=actor and status in ('reserved','claimed')),'[]'::jsonb),
    'server_now',clock_timestamp());
end $$;
notify pgrst,'reload schema';
commit;
