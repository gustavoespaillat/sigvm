-- Cover foreign-key columns identified by Supabase performance advisors.
create index if not exists audit_logs_actor_user_id_idx
  on public.audit_logs(actor_user_id);
create index if not exists role_permissions_permission_id_idx
  on public.role_permissions(permission_id);
