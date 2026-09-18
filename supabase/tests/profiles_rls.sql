-- Run as the database owner. All test writes are rolled back.
begin;
-- A temporary FK fixture, not an authentication/signup test or real account.
select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
insert into auth.users(id) values (auth.uid());
set local role authenticated;

savepoint role_test;
insert into public.profiles(role) values ('donor');
do $$ begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'Own profile should be visible';
  end if;
  begin
    insert into public.profiles(role) values ('volunteer');
    raise exception 'Duplicate role choice was allowed';
  exception when unique_violation then null; end;
  begin
    update public.profiles set role = 'ngo';
    raise exception 'Role update was allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.profiles;
    raise exception 'Profile deletion was allowed';
  exception when insufficient_privilege then null; end;
end $$;
rollback to role_test;
insert into public.profiles(role) values ('volunteer');
rollback to role_test;
insert into public.profiles(role) values ('ngo');
rollback to role_test;

do $$ begin
  begin
    insert into public.profiles(role) values ('admin');
    raise exception 'Invalid role was allowed';
  exception when check_violation then null; end;
  begin
    insert into public.profiles(id, role)
      values ('00000000-0000-0000-0000-000000000001', 'donor');
    raise exception 'Another user profile could be created';
  exception when insufficient_privilege then null; end;
end $$;

-- Make an owner-inserted row visible to this user, then query as a different user.
reset role;
insert into public.profiles(id, role) values (auth.uid(), 'donor');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.profiles) <> 0 then
    raise exception 'Another user profile was visible';
  end if;
end $$;

reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.profiles;
    raise exception 'Anonymous read was allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.profiles(role) values ('donor');
    raise exception 'Anonymous insert was allowed';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
