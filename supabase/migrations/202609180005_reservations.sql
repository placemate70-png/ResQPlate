begin;
alter table public.donations
  add column reserved_by uuid references public.profiles(id),
  add column reserved_at timestamptz,
  add column reservation_expires_at timestamptz;
alter table public.donations add constraint reservation_state_check check (
  (status='available' and reserved_by is null and reserved_at is null and reservation_expires_at is null)
  or (status in ('reserved','claimed') and reserved_by is not null and reserved_at is not null
      and reservation_expires_at=reserved_at+interval '60 seconds')
);
alter policy "Volunteers read available donations" on public.donations using (
  exists(select 1 from public.profiles where id=(select auth.uid()) and role='volunteer')
  and (status='available' or reserved_by=(select auth.uid()))
);
create function public.reserve_donation(donation_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); item public.donations; server_time timestamptz;
begin
  if actor is null or not exists(select 1 from public.profiles where id=actor and role='volunteer') then
    raise exception 'Volunteer role required' using errcode='42501';
  end if;
  select * into item from public.donations where id=donation_id for update;
  if not found then return jsonb_build_object('success',false,'message','Donation not found'); end if;
  if item.status='reserved' and item.reserved_by=actor then
    return jsonb_build_object('success',true,'donation',to_jsonb(item),'server_now',clock_timestamp());
  end if;
  if item.status<>'available' then
    return jsonb_build_object('success',false,'message','Donation is no longer available');
  end if;
  server_time := clock_timestamp();
  update public.donations set status='reserved',reserved_by=actor,reserved_at=server_time,
    reservation_expires_at=server_time+interval '60 seconds' where id=donation_id returning * into item;
  return jsonb_build_object('success',true,'donation',to_jsonb(item),'server_now',server_time);
end $$;
revoke all on function public.reserve_donation(uuid) from public,anon;
grant execute on function public.reserve_donation(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
