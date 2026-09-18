begin;
alter table public.donations add column claimed_at timestamptz;
alter table public.donations add constraint confirmed_state_check check (
  (status='claimed' and claimed_at is not null) or (status<>'claimed' and claimed_at is null)
);
create index donations_expiry_idx on public.donations(reservation_expires_at) where status='reserved';

create function public.expire_reservations() returns void
language sql security definer set search_path='' as $$
  with expired as (
    select id from public.donations where status='reserved' and reservation_expires_at<=clock_timestamp()
      for update skip locked
  ) update public.donations d set status='available',reserved_by=null,reserved_at=null,reservation_expires_at=null
    from expired where d.id=expired.id;
$$;
revoke all on function public.expire_reservations() from public,anon,authenticated;

create or replace function public.reserve_donation(donation_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); item public.donations; server_time timestamptz;
begin
  if actor is null or not exists(select 1 from public.profiles where id=actor and role='volunteer') then
    raise exception 'Volunteer role required' using errcode='42501';
  end if;
  select * into item from public.donations where id=donation_id for update;
  if not found then return jsonb_build_object('success',false,'message','Donation not found'); end if;
  server_time := clock_timestamp();
  if item.status='reserved' and item.reservation_expires_at<=server_time then
    update public.donations set status='available',reserved_by=null,reserved_at=null,reservation_expires_at=null
      where id=donation_id returning * into item;
  end if;
  if item.status='reserved' and item.reserved_by=actor then
    return jsonb_build_object('success',true,'donation',to_jsonb(item),'server_now',server_time);
  end if;
  if item.status<>'available' then
    return jsonb_build_object('success',false,'message','Donation is no longer available');
  end if;
  update public.donations set status='reserved',reserved_by=actor,reserved_at=server_time,
    reservation_expires_at=server_time+interval '60 seconds' where id=donation_id returning * into item;
  return jsonb_build_object('success',true,'donation',to_jsonb(item),'server_now',server_time);
end $$;

create function public.confirm_reservation(donation_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); item public.donations; server_time timestamptz;
begin
  if actor is null or not exists(select 1 from public.profiles where id=actor and role='volunteer') then
    raise exception 'Volunteer role required' using errcode='42501';
  end if;
  select * into item from public.donations where id=donation_id for update;
  if not found or item.reserved_by is distinct from actor then
    return jsonb_build_object('success',false,'message','No reservation owned by this account');
  end if;
  server_time := clock_timestamp();
  if item.status='claimed' then
    return jsonb_build_object('success',true,'donation',to_jsonb(item),'server_now',server_time);
  end if;
  if item.status<>'reserved' or item.reservation_expires_at<=server_time then
    if item.status='reserved' then
      update public.donations set status='available',reserved_by=null,reserved_at=null,reservation_expires_at=null where id=donation_id;
    end if;
    return jsonb_build_object('success',false,'message','Reservation expired; reserve again');
  end if;
  update public.donations set status='claimed',claimed_at=server_time where id=donation_id returning * into item;
  return jsonb_build_object('success',true,'donation',to_jsonb(item),'server_now',server_time);
end $$;
revoke all on function public.confirm_reservation(uuid) from public,anon;
grant execute on function public.confirm_reservation(uuid) to authenticated;

create function public.grabboard_state() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not exists(select 1 from public.profiles where id=actor and role='volunteer') then
    raise exception 'Volunteer role required' using errcode='42501';
  end if;
  perform public.expire_reservations();
  return jsonb_build_object(
    'available',coalesce((select jsonb_agg(to_jsonb(d) order by created_at) from public.donations d where status='available'),'[]'::jsonb),
    'reservations',coalesce((select jsonb_agg(to_jsonb(d) order by reserved_at desc) from public.donations d where reserved_by=actor and status in ('reserved','claimed')),'[]'::jsonb),
    'server_now',clock_timestamp());
end $$;
revoke all on function public.grabboard_state() from public,anon;
grant execute on function public.grabboard_state() to authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('resqplate-reservation-expiry','1 second','select public.expire_reservations()');
notify pgrst,'reload schema';
commit;
