-- SIGVM role and tenant isolation tests (transactional, no persistent records).
-- Run in Supabase SQL Editor with an administrative database connection.
-- Creates synthetic test identities only within a transaction, then rolls back.
begin;
do $$
declare
  t1 uuid:=gen_random_uuid();
  t2 uuid:=gen_random_uuid();
  u1 uuid:=gen_random_uuid();
  u2 uuid:=gen_random_uuid();
  rep uuid:=gen_random_uuid();
  owner1 uuid:=gen_random_uuid();
  owner2 uuid:=gen_random_uuid();
  rep_role uuid:=gen_random_uuid();
  doc1 uuid:=gen_random_uuid();
  doc2 uuid:=gen_random_uuid();
  visit1 uuid:=gen_random_uuid();
  visit2 uuid:=gen_random_uuid();
  n integer;
begin
  -- This is a test scaffold; run only in an isolated test database.
  -- The production schema has auth.users FK, audit triggers and tenant constraints.
  -- The executable assertions below verify catalog security rather than inserting identities.
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='medical_visits' and policyname='medical_visits_select_authorized') then
    raise exception 'Missing authorized visits policy';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='medical_visits' and policyname='medical_visits_update_authorized') then
    raise exception 'Missing authorized visit update policy';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.medical_visits'::regclass and tgname='enforce_medical_visit_lifecycle_before_insert' and not tgisinternal) then
    raise exception 'Missing lifecycle insert trigger';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.medical_visits'::regclass and tgname='enforce_medical_visit_lifecycle_before_update' and not tgisinternal) then
    raise exception 'Missing lifecycle update trigger';
  end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='medical_visits' and policyname in ('medical_visits_select_member','medical_visits_update_member')) then
    raise exception 'Legacy overly permissive visit policy';
  end if;
  raise notice 'Catalog assertions passed; end-to-end RLS identity tests still required';
end $$;
rollback;
