"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Membership = { tenant_id: string; tenants: { display_name: string; slug: string } | null; roles: { name: string } | null };
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function load() {
    const client = getSupabaseBrowserClient();
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (!currentUser) { router.replace("/login"); return; }
    setUser(currentUser);
    const { data, error: queryError } = await client.from("tenant_memberships")
      .select("tenant_id, tenants(display_name, slug), roles(name)")
      .eq("user_id", currentUser.id).eq("status", "active");
    if (queryError) setError("No fue posible consultar tus empresas.");
    else setMemberships((data ?? []) as unknown as Membership[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function createTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    const form = new FormData(event.currentTarget);
    const legalName = String(form.get("legalName")).trim();
    const displayName = String(form.get("displayName")).trim();
    const slug = String(form.get("slug")).trim().toLowerCase();
    if (legalName.length < 2 || displayName.length < 2 || !/^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?$/.test(slug)) {
      setError("Verifica los datos y el identificador de empresa."); setBusy(false); return;
    }
    const { error: rpcError } = await getSupabaseBrowserClient().rpc("create_tenant_for_current_user", {
      p_legal_name: legalName, p_display_name: displayName, p_slug: slug,
    } as never);
    if (rpcError) setError("No se pudo crear la empresa. Comprueba que el identificador esté disponible.");
    else { setSuccess("Empresa creada correctamente."); await load(); }
    setBusy(false);
  }
  async function logout() {
    await getSupabaseBrowserClient().auth.signOut(); router.replace("/login");
  }
  if (loading) return <main className="p-8">Verificando sesión...</main>;
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="flex items-center justify-between border-b bg-white p-5">
      <strong className="text-blue-700">SIGVM</strong><button onClick={logout}>Cerrar sesión</button>
    </header>
    <section className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold">Espacio de trabajo</h1><p className="mt-3"><a href="/sigvm/crm/" className="inline-block rounded bg-blue-700 px-4 py-2 text-white">Gestionar médicos y centros de salud</a></p><p className="mt-2">{user?.email}</p>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {success && <p role="status" className="mt-4 text-green-700">{success}</p>}
      {memberships.length > 0 ? <section className="mt-8 rounded-xl border bg-white p-6">
        <h2 className="text-xl font-bold">Tus empresas</h2><ul className="mt-4 space-y-3">
          {memberships.map(m => <li key={m.tenant_id} className="rounded border p-3">
            <strong>{m.tenants?.display_name ?? "Empresa"}</strong>
            <p>{m.tenants?.slug} · {m.roles?.name ?? "Miembro"}</p>
          </li>)}
        </ul>
      </section> : <section className="mt-8 max-w-xl rounded-xl border bg-white p-6">
        <h2 className="text-xl font-bold">Configura tu empresa</h2>
        <form onSubmit={createTenant} className="mt-5 space-y-4">
          <label className="block">Razón social<input name="legalName" required minLength={2} maxLength={180} className="mt-1 w-full rounded border p-2" /></label>
          <label className="block">Nombre comercial<input name="displayName" required minLength={2} maxLength={100} className="mt-1 w-full rounded border p-2" /></label>
          <label className="block">Identificador<input name="slug" required maxLength={48} pattern="[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?" className="mt-1 w-full rounded border p-2" /></label>
          <button disabled={busy} className="rounded bg-blue-700 px-5 py-3 text-white disabled:opacity-50">{busy ? "Creando..." : "Crear empresa"}</button>
        </form>
      </section>}
    </section>
  </main>;
}
