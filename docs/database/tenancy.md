# Modelo multiempresa

- `tenants`: organización cliente.
- `tenant_memberships`: relación usuario-empresa y rol vigente.
- `roles` y `role_permissions`: RBAC por empresa.
- `permissions`: catálogo global de permisos.
- `user_profiles`: perfil global del usuario, sin duplicarlo por tenant.
- `audit_logs`: eventos de auditoría vinculados a tenant.

## Reglas para nuevos módulos
Toda tabla de negocio incluirá `tenant_id NOT NULL`, índices que comiencen por
`tenant_id`, y FKs compuestas cuando relacione entidades del mismo tenant.
Habilitar RLS antes de conceder acceso a `authenticated`. Crear políticas por
operación y probar dos tenants con usuarios separados. Las vistas deben usar
`security_invoker = true` cuando aplique.

## Próximas entidades
CRM: doctors, specialties, medical_centers, doctor_workplaces.
Comercial: visitors, supervisors, territories, territory_assignments, products.
Visitas: visits, visit_products, visit_samples, routes, route_stops, visit_evidence.
IA: ai_agents, ai_agent_versions, ai_tasks, ai_executions, ai_approvals, ai_usage.
Billing: plans, subscriptions, invoices, payments, usage_records.
