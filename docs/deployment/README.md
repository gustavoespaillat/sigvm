# Despliegue

1. Crear proyecto Supabase exclusivo para SIGVM.
2. Aplicar migraciones revisadas con Supabase CLI.
3. Configurar Auth redirect URLs para localhost y dominio Vercel.
4. Configurar variables de entorno en Vercel.
5. Desplegar Next.js en Vercel.
6. Configurar GitHub Actions para lint, typecheck, tests y build.
7. Publicar solo `docs/` como sitio estático en GitHub Pages.

No desplegar secretos en GitHub Pages ni en variables `NEXT_PUBLIC_*`.
