# Arquitectura SIGVM

## Principios
1. Multi-tenancy compartido con `tenant_id` y aislamiento RLS.
2. La membresía activa es la fuente de pertenencia; nunca confiar en tenant_id del cliente.
3. Roles y permisos por tenant.
4. Servicios de negocio tipados; agentes IA no ejecutan SQL arbitrario.
5. Operaciones sensibles requieren aprobación humana.
6. Auditoría para cambios y ejecuciones relevantes.

## Capas
- Presentación: Next.js App Router.
- Aplicación: Server Actions y Route Handlers validados con Zod.
- Dominio: casos de uso por módulo.
- Persistencia: repositorios Supabase/PostgreSQL.
- Seguridad: Auth, RBAC, RLS, rate limits y auditoría.
- IA: orquestador, tareas asíncronas, herramientas allowlisted y presupuesto.
- Integraciones: pagos, correo, mapas y proveedor LLM intercambiables.

## Dominios
Core/tenants, CRM médico, equipo comercial, visitas, geografía, productos/muestras,
KPI/reportes, IA multiagente, suscripciones/facturación y notificaciones.

## Decisión de despliegue
Next.js en Vercel; PostgreSQL/Auth/Storage/Edge Functions en Supabase;
documentación estática en GitHub Pages. GitHub Pages no ejecuta Next.js SSR.
