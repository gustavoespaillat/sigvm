-- SIGVM authentication and first-tenant onboarding.
-- Creates the profile automatically and provides a single atomic tenant bootstrap RPC.
begin;

insert into public.permissions (code, description) values
  ('tenant.read', 'Consultar datos básicos de la empresa'),
  ('tenant.manage', 'Administrar configuración de la empresa'),
  ('members.read', 'Consultar miembros de la empresa'),
  ('members.manage', 'Invitar y administrar miembros'),
  ('roles.manage', 'Administrar roles y permisos'),
  ('audit.read', 'Consultar auditoría'),
  ('crm.read', 'Consultar registros CRM'),
  ('crm.manage', 'Administrar registros CRM'),
  ('visits.read', 'Consultar visitas médicas'),
  ('visits.manage', 'Crear y administrar visitas'),
  ('reports.read', 'Consultar informes y KPI'),
  ('billing.manage', 'Administrar suscripción y facturación')
on conflict (code) do nothing;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_sigvm on auth.users;
create trigger on_auth_user_created_sigvm
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function public.create_tenant_for_current_user(
  p_legal_name text,
  p_display_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_tenant_id uuid;
  v_role_id uuid;
  v_slug text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if length(trim(coalesce(p_legal_name, ''))) < 2
     or length(trim(coalesce(p_display_name, ''))) < 2 then
    raise exception 'Company names must contain at least 2 characters' using errcode = '22023';
  end if;

  v_slug := lower(trim(coalesce(p_slug, '')));
  if v_slug !~ '^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?$' then
    raise exception 'Invalid company slug' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.tenant_memberships m
    where m.user_id = v_user_id and m.status = 'active'
  ) then
    raise exception 'This user already has an active company membership' using errcode = '23505';
  end if;

  insert into public.tenants (legal_name, display_name, slug)
  values (trim(p_legal_name), trim(p_display_name), v_slug)
  returning id into v_tenant_id;

  insert into public.roles (tenant_id, code, name, description, is_system)
  values (v_tenant_id, 'tenant_owner', 'Administrador principal',
          'Administrador inicial de la empresa', true)
  returning id into v_role_id;

  insert into public.role_permissions (tenant_id, role_id, permission_id)
  select v_tenant_id, v_role_id, p.id
  from public.permissions p;

  insert into public.tenant_memberships
    (tenant_id, user_id, role_id, status, joined_at)
  values (v_tenant_id, v_user_id, v_role_id, 'active', now());

  insert into public.tenant_settings (tenant_id)
  values (v_tenant_id);

  insert into public.audit_logs
    (tenant_id, actor_user_id, action, resource_type, resource_id, metadata)
  values (v_tenant_id, v_user_id, 'tenant.created', 'tenant', v_tenant_id,
          jsonb_build_object('source', 'self_service_onboarding'));

  return v_tenant_id;
end;
$$;

revoke all on function public.create_tenant_for_current_user(text,text,text) from public, anon;
grant execute on function public.create_tenant_for_current_user(text,text,text) to authenticated;

commit;
