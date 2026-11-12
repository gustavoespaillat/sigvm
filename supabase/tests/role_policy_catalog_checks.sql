-- SIGVM role and tenant isolation tests (transactional, no persistent records).
-- Run in Supabase SQL Editor with an administrative database connection.
-- Catalog-only assertions; does not create synthetic identities.
begin;
do $$
begin
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
