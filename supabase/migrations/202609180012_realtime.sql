begin;
do $$ declare tab text; begin
 foreach tab in array array['rescues','donations','ngo_availability'] loop
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=tab) then
   execute format('alter publication supabase_realtime add table public.%I',tab);
  end if;
 end loop;
end $$;
commit;
