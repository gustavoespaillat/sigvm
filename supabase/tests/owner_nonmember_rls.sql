-- SIGVM: real owner and nonmember RLS read checks.
-- Uses an existing tenant owner only as an identity claim.
-- Does not modify records; transaction always rolls back.
begin;
do $$
declare
 v_owner uuid;
 v_tenant uuid;
 v_visible bigint;
 v_random uuid:=gen_random_uuid();
begin
 select m.user_id,m.tenant_id into v_owner,v_tenant
 from public.tenant_memberships m
 join public.roles r on r.id=m.role_id
 where m.status='active' and r.code='tenant_owner'
 limit 1;
 if v_owner is null then raise exception 'No active tenant owner for test'; end if;
 perform set_config('request.jwt.claim.sub',v_owner::text,true);
 execute 'set local role authenticated';
 select count(*) into v_visible from public.tenant_memberships
 where tenant_id=v_tenant and user_id=v_owner;
 if v_visible<>1 then raise exception 'Owner cannot read own membership'; end if;
 perform set_config('request.jwt.claim.sub',v_random::text,true);
 select count(*) into v_visible from public.tenant_memberships;
 if v_visible<>0 then raise exception 'Nonmember can read memberships'; end if;
 select count(*) into v_visible from public.medical_visits;
 if v_visible<>0 then raise exception 'Nonmember can read visits'; end if;
 raise notice 'Owner and nonmember read access checks passed';
end $$;
rollback;
