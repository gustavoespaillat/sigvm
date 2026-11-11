import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTenantAction, logoutAction } from "@/app/auth/actions";

type Props = { searchParams: Promise<{ error?: string; created?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, status, tenants(display_name, slug), roles(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const hasTenant = (memberships?.length ?? 0) > 0;
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-bold tracking-widest text-blue-700">SIGVM</span>
          <form action={logoutAction}><button className="text-sm font-medium text-slate-600 hover:text-slate-900">Cerrar sesión</button></form>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm font-semibold text-blue-700">ESPACIO DE TRABAJO</p>
        <h1 className="mt-2 text-3xl font-bold">Bienvenido{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}</h1>
        <p className="mt-2 text-slate-600">{user.email}</p>
        {params.created && <p className="mt-6 rounded-lg bg-green-50 p-3 text-sm text-green-800">Empresa creada correctamente.</p>}
        {params.error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-800">No fue posible crear la empresa. Revisa que el identificador esté disponible y vuelve a intentarlo.</p>}
        {hasTenant ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Tus empresas</h2>
            <ul className="mt-4 space-y-3">
              {memberships?.map((membership) => {
                const tenant = membership.tenants as unknown as { display_name: string; slug: string } | null;
                const role = membership.roles as unknown as { name: string } | null;
                return <li key={membership.tenant_id} className="rounded-lg border border-slate-200 p-4"><p className="font-semibold">{tenant?.display_name ?? "Empresa"}</p><p className="text-sm text-slate-600">{tenant?.slug} · {role?.name ?? "Miembro"}</p></li>;
              })}
            </ul>
          </div>
        ) : (
          <div className="mt-8 max-w-xl rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Configura tu empresa</h2>
            <p className="mt-2 text-sm text-slate-600">La creación asigna el rol de administrador principal y configura permisos iniciales de forma atómica.</p>
            <form action={createTenantAction} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">Razón social<input name="legalName" required minLength={2} maxLength={180} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-medium">Nombre comercial<input name="displayName" required minLength={2} maxLength={100} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-medium">Identificador de empresa<input name="slug" required pattern="[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?" maxLength={48} placeholder="mi-empresa" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /><span className="mt-1 block text-xs text-slate-500">Minúsculas, números y guiones; debe ser único.</span></label>
              <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">Crear empresa</button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
