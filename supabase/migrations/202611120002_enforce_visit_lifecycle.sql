-- SIGVM: Restrict medical visit lifecycle and reassignments.
-- Requires private.is_tenant_owner(uuid) from the RBAC migration.
create or replace function private.enforce_medical_visit_lifecycle() returns trigger language plpgsql security definer set search_path='' as $$
declare v_owner boolean;
begin
 if tg_op='INSERT' then
  if new.status <> 'planned' then raise exception 'New visits must start as planned' using errcode='23514'; end if;
  return new;
 end if;
 v_owner:=private.is_tenant_owner(old.tenant_id);
 if new.id is distinct from old.id or new.tenant_id is distinct from old.tenant_id or
    new.physician_id is distinct from old.physician_id or new.created_by is distinct from old.created_by or
    new.created_at is distinct from old.created_at then
  raise exception 'Visit identity fields cannot be changed' using errcode='42501';
 end if;
 if (new.assigned_to is distinct from old.assigned_to or new.territory_id is distinct from old.territory_id or
     new.scheduled_at is distinct from old.scheduled_at) and not v_owner then
  raise exception 'Only owner can reschedule or reassign visits' using errcode='42501';
 end if;
 if new.status is distinct from old.status and (old.status <> 'planned' or new.status not in ('completed','cancelled')) then
  raise exception 'Invalid visit status transition' using errcode='23514';
 end if;
 if old.status <> 'planned' and (new.notes is distinct from old.notes or new.scheduled_at is distinct from old.scheduled_at or new.assigned_to is distinct from old.assigned_to or new.territory_id is distinct from old.territory_id) then
  raise exception 'Closed visits cannot be edited' using errcode='23514';
 end if;
 return new;
end;
$$;
revoke all on function private.enforce_medical_visit_lifecycle() from public,anon,authenticated;
drop trigger if exists enforce_medical_visit_lifecycle_before_insert on public.medical_visits;
drop trigger if exists enforce_medical_visit_lifecycle_before_update on public.medical_visits;
create trigger enforce_medical_visit_lifecycle_before_insert before insert on public.medical_visits for each row execute function private.enforce_medical_visit_lifecycle();
create trigger enforce_medical_visit_lifecycle_before_update before update on public.medical_visits for each row execute function private.enforce_medical_visit_lifecycle();