# Autenticación y aprovisionamiento

## Flujo inicial
1. El usuario crea una cuenta con correo y contraseña.
2. Supabase Auth crea la identidad.
3. Un trigger de base de datos crea el perfil básico.
4. El usuario inicia sesión.
5. Desde el dashboard solicita crear su empresa.
6. Una función transaccional crea tenant, rol `tenant_owner`, permisos,
   membresía activa, ajustes y evento de auditoría.
7. La empresa solo aparece para usuarios cuya membresía activa satisface RLS.

## Controles
- La identidad se obtiene con `auth.getUser()` en el servidor.
- Las entradas se validan con Zod y también en PostgreSQL.
- El RPC de aprovisionamiento exige `auth.uid()`, valida el slug y serializa
  altas concurrentes del mismo usuario con un advisory transaction lock.
- El RPC es `SECURITY DEFINER` de forma intencional para ejecutar el alta
  atómica sin conceder escrituras directas sobre tablas de tenants y roles.
  Su cuerpo usa `search_path = ''`, nombres cualificados, verifica identidad,
  y EXECUTE se concede únicamente a `authenticated`.
- Nunca se usa `user_metadata` para conceder permisos.
- La clave service_role no se utiliza en el navegador.

## Configuración pendiente en Supabase Auth
Configura Site URL y Redirect URLs para localhost y el dominio de despliegue
cuando Vercel esté conectado. Decide si el producto exigirá confirmación de
correo; la interfaz ya informa al usuario cuando se activa ese requisito.

## Pruebas antes de producción
- Registro con correo nuevo y duplicado.
- Confirmación de correo y sesión.
- Perfil creado por el trigger.
- Alta de empresa con slug disponible y duplicado.
- Dos solicitudes concurrentes para un mismo usuario.
- Usuario A no puede consultar datos del tenant B.
- Usuario sin sesión no puede llamar al RPC.
