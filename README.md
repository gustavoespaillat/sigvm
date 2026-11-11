# SIGVM

Sistema Inteligente de Gestión de Visita Médica — SaaS multiempresa.

## Stack
- Next.js App Router, React, TypeScript strict, Tailwind
- Supabase Auth, PostgreSQL, Storage y Edge Functions
- RLS multi-tenant; Vercel para la aplicación
- GitHub Pages únicamente para documentación estática

## Estado
Starter de arquitectura. No es todavía una aplicación productiva. La primera migración establece el núcleo de identidad, tenants, membresías, RBAC y auditoría. Los módulos CRM, visitas, IA y facturación se incorporarán mediante migraciones independientes.

## Requisitos
- Node.js LTS
- npm
- Supabase CLI
- Proyecto Supabase dedicado

## Desarrollo local
```bash
npm install
cp .env.example .env.local
npm run dev
```

Completa `.env.local` con la URL y la clave publishable del proyecto Supabase. Nunca coloques `service_role` en variables `NEXT_PUBLIC_*`.

## Migraciones
```bash
supabase start
supabase migration list
supabase db reset
```

Antes de aplicar migraciones en producción, revisar el SQL, respaldar la base y ejecutar pruebas RLS en un entorno no productivo.

## Despliegue
- Aplicación: Vercel
- Base de datos/Auth/Storage: Supabase
- Documentación: GitHub Pages

GitHub Pages no aloja el servidor dinámico de Next.js.
