# SIGVM

Sistema Inteligente de Gestión de Visita Médica — SaaS multiempresa.

## Stack
- Next.js App Router, React, TypeScript strict, Tailwind
- Supabase Auth, PostgreSQL, Storage y Edge Functions
- RLS multi-tenant; Vercel para la aplicación
- GitHub Pages únicamente para documentación estática

## Funcionalidad implementada
- Registro e inicio de sesión con Supabase Auth.
- Actualización de sesión en middleware.
- Perfil creado automáticamente al registrar usuario.
- Aprovisionamiento atómico de empresa y rol inicial `tenant_owner`.
- Dashboard protegido que muestra membresías propias.
- RLS en el núcleo multiempresa.

## Estado
Base funcional inicial de autenticación y multi-tenancy. No es todavía una aplicación
productiva. CRM, visitas, geografía, IA, facturación y pruebas integrales siguen
pendientes. No cargar datos médicos o personales reales hasta completar revisión
de seguridad, privacidad, pruebas y controles operativos.

## Requisitos
- Node.js 22
- npm
- Proyecto Supabase dedicado

## Desarrollo local
```bash
npm install
cp .env.example .env.local
npm run dev
```

Completa `.env.local` con la URL y la clave publishable del proyecto Supabase.
Nunca coloques `service_role` en variables `NEXT_PUBLIC_*`.

## Migraciones
```bash
supabase start
supabase migration list
supabase db reset
```

Antes de aplicar migraciones en producción, revisar el SQL, respaldar la base y
ejecutar pruebas RLS en un entorno no productivo.

## Despliegue
- Aplicación: Vercel
- Base de datos/Auth/Storage/Edge Functions: Supabase
- Documentación: GitHub Pages

GitHub Pages no aloja el servidor dinámico de Next.js.
