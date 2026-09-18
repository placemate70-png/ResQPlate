-- Run as database owner; all fixtures and release changes roll back.
begin;
do $$
declare donor uuid; food text; temperature numeric; hours numeric; item public.donations;
  anchor_id uuid; pending_id uuid; other_id uuid; batch uuid;
begin
  select id into donor from public.profiles where role='donor' limit 1;
  if donor is null then raise exception 'A donor QA profile is required'; end if;
  foreach food in array array['gravy','dry','rice'] loop
    foreach temperature in array array[29.9,30,38,38.1] loop
      insert into public.donations(donor_id,food_name,food_type,temperature_c,quantity,quantity_unit,container,container_count,prepared_at)
        values(donor,'QA freshness boundary',food,temperature,3,'kg','QA vessel',1,now()) returning * into item;
      hours := (case when food='gravy' then 1.5 else 4 end)+(case when temperature<30 then 1 else 0 end);
      if extract(epoch from item.freshness_expires_at-item.prepared_at)<>hours*3600 or item.estimated_plates<>10 then
        raise exception 'Food metrics boundary failed';
      end if;
    end loop;
  end loop;
  if abs(public.distance_km(0,0,degrees(1.5/6371.0088),0)-1.5)>0.000000001 then raise exception 'Distance boundary failed'; end if;
  insert into public.donations(donor_id,food_name,food_type,temperature_c,quantity,quantity_unit,container,container_count,prepared_at,created_at,latitude,longitude)
    values(donor,'QA mature anchor','gravy',28,1,'kg','QA vessel',1,now()-interval '181 seconds',now()-interval '181 seconds',0,0)
    returning id into anchor_id;
  insert into public.donations(donor_id,food_name,food_type,temperature_c,quantity,quantity_unit,container,container_count,prepared_at,latitude,longitude)
    values(donor,'QA pending neighbour','gravy',28,1,'kg','QA vessel',1,now(),0.001,0) returning id into pending_id;
  insert into public.donations(donor_id,food_name,food_type,temperature_c,quantity,quantity_unit,container,container_count,prepared_at,latitude,longitude)
    values(donor,'QA incompatible neighbour','rice',28,1,'kg','QA vessel',1,now(),0.001,0) returning id into other_id;
  perform public.release_route_donations();
  select route_batch_id into batch from public.donations where id=anchor_id and route_state='released';
  if batch is null then raise exception 'Pending neighbour was not batched'; end if;
  if not exists(select 1 from public.donations where id=pending_id and route_batch_id=batch and route_state='holding') then
    raise exception 'Pending neighbour must retain its full hold';
  end if;
  if exists(select 1 from public.donations where id=other_id and route_batch_id=batch) then raise exception 'Incompatible food batched'; end if;
end $$;
rollback;
