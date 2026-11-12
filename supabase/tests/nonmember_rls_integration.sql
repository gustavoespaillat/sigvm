-- SIGVM: negative RLS integration check for an authenticated nonmember.
-- Run in Supabase SQL Editor with privileges to SET ROLE authenticated.
-- All changes are rolled back; no business records are modified.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
do $$
declare v_count bigint;
begin
 select count(*) into v_count from public.tenants;
 if v_count<>0 then raise exception 'Nonmember can read tenants'; end if;
 select count(*) into v_count from public.tenant_memberships;
 if v_count<>0 then raise exception 'Nonmember can read memberships'; end if;
 select count(*) into v_count from public.medical_visits;
 if v_count<>0 then raise exception 'Nonmember can read visits'; end if;
 select count(*) into v_count from public.physicians;
 if v_count<>0 then raise exception 'Nonmember can read physicians'; end if;
 select count(*) into v_count from public.health_centers;
 if v_count<>0 then raise exception 'Nonmember can read centers'; end if;
 select count(*) into v_count from public.territories;
 if v_count<>0 then raise exception 'Nonmember can read territories'; end if;
 select count(*) into v_count from public.medical_visit_events;
 if v_count<>0 then raise exception 'Nonmember can read visit history'; end if;
 raise notice 'Nonmember RLS read isolation passed';
end $$;
rollback;
