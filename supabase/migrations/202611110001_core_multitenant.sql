
-- SIGVM core: tenant isolation, memberships, RBAC and audit.
-- Apply only to a dedicated SIGVM Supabase project after review.
begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.tenant_status as enum ('trialing','active','suspended','closed');
create type public.membership_status as enum ('invited','active','suspended','removed');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  slug text not null unique,
  status public.tenant_status not null default 'trialing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, code),
  unique (tenant_id, id)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null
);

create table public.role_permissions (
  tenant_id uuid not null,
  role_id uuid not null,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (tenant_id, role_id, permission_id),
  foreign key (tenant_id, role_id) references public.roles(tenant_id, id) on delete cascade
);

create table public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null,
  status public.membership_status not null default 'invited',
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  foreign key (tenant_id, role_id) references public.roles(tenant_id, id)
);

create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  timezone text not null default 'America/Santo_Domingo',
  locale text not null default 'es-DO',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index tenant_memberships_user_status_idx
  on public.tenant_memberships(user_id, status);
create index tenant_memberships_tenant_role_idx
  on public.tenant_memberships(tenant_id, role_id);
create index audit_logs_tenant_created_idx
  on public.audit_logs(tenant_id, created_at desc);
create index roles_tenant_code_idx on public.roles(tenant_id, code);

-- Authorization helpers use SECURITY INVOKER and are scoped to the caller.
create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql stable security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.tenant_memberships m
    where m.tenant_id = p_tenant_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.has_tenant_permission(p_tenant_id uuid, p_permission text)
returns boolean
language sql stable security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_memberships m
    join public.role_permissions rp
      on rp.tenant_id = m.tenant_id and rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.tenant_id = p_tenant_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and p.code = p_permission
  );
$$;

-- Every public application table is RLS protected.
alter table public.tenants enable row level security;
alter table public.user_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy "tenant members can read their tenants"
on public.tenants for select to authenticated
using (public.is_tenant_member(id));

create policy "users read own profile"
on public.user_profiles for select to authenticated
using (user_id = (select auth.uid()));
create policy "users insert own profile"
on public.user_profiles for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "users update own profile"
on public.user_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "members read tenant roles"
on public.roles for select to authenticated
using (public.is_tenant_member(tenant_id));
create policy "members read permissions"
on public.permissions for select to authenticated
using (exists (
  select 1 from public.role_permissions rp
  join public.tenant_memberships m
    on m.tenant_id = rp.tenant_id and m.role_id = rp.role_id
  where rp.permission_id = permissions.id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));
create policy "members read role permissions"
on public.role_permissions for select to authenticated
using (public.is_tenant_member(tenant_id));

create policy "members read tenant memberships"
on public.tenant_memberships for select to authenticated
using (user_id = (select auth.uid()));

create policy "members read tenant settings"
on public.tenant_settings for select to authenticated
using (public.is_tenant_member(tenant_id));

create policy "members read tenant audit logs"
on public.audit_logs for select to authenticated
using (public.is_tenant_member(tenant_id));

-- No client-side INSERT/UPDATE/DELETE policies for tenant administration,
-- role assignment or audit logs in this bootstrap migration. Those operations
-- will be implemented through narrowly scoped server-side business functions.

grant usage on schema public to authenticated;
grant select on public.tenants, public.roles, public.permissions,
  public.role_permissions, public.tenant_memberships, public.tenant_settings,
  public.audit_logs to authenticated;
grant select, insert, update on public.user_profiles to authenticated;
grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.has_tenant_permission(uuid,text) to authenticated;

commit;
