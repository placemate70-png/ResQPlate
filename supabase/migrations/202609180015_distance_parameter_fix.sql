begin;
-- Reuse RouteBuddy's distance formula; donation visibility remains governed by RLS.
create or replace function public.donation_distances(ids uuid[],latitude double precision,longitude double precision)
returns table(donation_id uuid,distance_km double precision)
language plpgsql stable security invoker set search_path='' as $$
begin
 if latitude is null or longitude is null or not(latitude between -90 and 90) or not(longitude between -180 and 180) or cardinality(ids)>100 then raise exception 'Invalid distance inputs'; end if;
 return query select d.id,public.distance_km(donation_distances.latitude,donation_distances.longitude,d.latitude,d.longitude) from public.donations d where d.id=any(ids) and d.latitude is not null and d.longitude is not null;
end $$;
revoke all on function public.donation_distances(uuid[],double precision,double precision) from public,anon;
grant execute on function public.donation_distances(uuid[],double precision,double precision) to authenticated;
notify pgrst,'reload schema';
commit;
