-- SIGVM: RBAC initial hardening. Applied to Supabase as migration restrict_crm_visits_to_owner_and_assignee.
-- Apply only after core, CRM, visits, territories and visit event migrations.
create schema if not exists private;
create or replace function private.is_tenant_owner(p_tenant_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (
  select 1 from public.tenant_memberships m
  join public.roles r on r.id=m.role_id and r.tenant_id=m.tenant_id
  where m.tenant_id=p_tenant_id and m.user_id=(select auth.uid())
   and m.status='active' and r.code='tenant_owner'
 );
$$;
revoke all on function private.is_tenant_owner(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.is_tenant_owner(uuid) to authenticated;
drop policy if exists "health_centers_insert_member" on public.health_centers;
drop policy if exists "health_centers_insert_owner" on public.health_centers;
create policy "health_centers_insert_owner" on public.health_centers for insert to authenticated with check (private.is_tenant_owner(tenant_id));
drop policy if exists "physicians_insert_member" on public.physicians;
drop policy if exists "physicians_insert_owner" on public.physicians;
create policy "physicians_insert_owner" on public.physicians for insert to authenticated with check (private.is_tenant_owner(tenant_id));
drop policy if exists "territories_insert" on public.territories;
drop policy if exists "territories_insert_owner" on public.territories;
create policy "territories_insert_owner" on public.territories for insert to authenticated with check (private.is_tenant_owner(tenant_id));
drop policy if exists "medical_visits_insert_member" on public.medical_visits;
drop policy if exists "medical_visits_insert_owner" on public.medical_visits;
create policy "medical_visits_insert_owner" on public.medical_visits for insert to authenticated with check (private.is_tenant_owner(tenant_id) and created_by=(select auth.uid()));
drop policy if exists "medical_visits_select_member" on public.medical_visits;
drop policy if exists "medical_visits_select_authorized" on public.medical_visits;
create policy "medical_visits_select_authorized" on public.medical_visits for select to authenticated using (private.is_tenant_owner(tenant_id) or (public.is_tenant_member(tenant_id) and assigned_to=(select auth.uid())));
drop policy if exists "medical_visits_update_member" on public.medical_visits;
drop policy if exists "medical_visits_update_authorized" on public.medical_visits;
create policy "medical_visits_update_authorized" on public.medical_visits for update to authenticated
 using (private.is_tenant_owner(tenant_id) or (public.is_tenant_member(tenant_id) and assigned_to=(select auth.uid())))
 with check (private.is_tenant_owner(tenant_id) or (public.is_tenant_member(tenant_id) and assigned_to=(select auth.uid())));
drop policy if exists "medical_visit_events_select_member" on public.medical_visit_events;
drop policy if exists "medical_visit_events_select_authorized" on public.medical_visit_events;
create policy "medical_visit_events_select_authorized" on public.medical_visit_events for select to authenticated
 using (exists(select 1 from public.medical_visits v where v.id=visit_id and v.tenant_id=tenant_id));
