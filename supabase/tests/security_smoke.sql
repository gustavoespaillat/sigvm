-- SIGVM: structural security smoke tests. Run in Supabase SQL Editor.
-- These checks do not create users or modify business records.
do $$
declare v_count integer;
begin
 select count(*) into v_count from pg_tables
 where schemaname='public' and tablename in
 ('tenants','tenant_memberships','physicians','health_centers','medical_visits','medical_visit_events','territories','visitador_profiles');
 if v_count <> 8 then raise exception 'Expected 8 core tables, found %',v_count; end if;
 select count(*) into v_count from pg_tables
 where schemaname='public' and tablename in
 ('tenant_memberships','physicians','health_centers','medical_visits','medical_visit_events','territories','visitador_profiles')
 and rowsecurity;
 if v_count <> 7 then raise exception 'RLS missing on one or more tables'; end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='medical_visits' and policyname='medical_visits_select_authorized') then
  raise exception 'Missing authorized visit select policy';
 end if;
 if exists(select 1 from pg_policies where schemaname='public' and tablename='medical_visits' and policyname in ('medical_visits_select_member','medical_visits_update_member','medical_visits_insert_member')) then
  raise exception 'Permissive legacy visit policy still exists';
 end if;
 if not exists(select 1 from pg_trigger where tgrelid='public.medical_visits'::regclass and tgname='enforce_medical_visit_lifecycle_before_update' and not tgisinternal) then
  raise exception 'Missing lifecycle trigger';
 end if;
 if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='is_tenant_owner' and p.prosecdef) then
  raise exception 'Missing owner permission function';
 end if;
 raise notice 'SIGVM structural security checks passed';
end $$;
