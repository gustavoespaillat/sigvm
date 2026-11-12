"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Center = { id: string; name: string; city: string | null };
type Physician = { id: string; full_name: string; specialty: string | null; health_center_id: string | null };
type Tenant = { tenant_id: string; tenants: { display_name: string } | null };
export default function CrmPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [centers, setCenters] = useState<Center[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      const db = getSupabaseBrowserClient();
      const { data: { user } } = await db.auth.getUser();
      if (!active) return;
      if (!user) { router.replace("/login"); return; }
      const { data, error: e } = await db.from("tenant_memberships").select("tenant_id,tenants(display_name)").eq("user_id", user.id).eq("status","active");
      if (!active) return;
      if (e) setError(e.message);
      else { const list = (data ?? []) as unknown as Tenant[]; setTenants(list); setTenantId(list[0]?.tenant_id ?? ""); }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [router]);
  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    (async () => {
      const db = getSupabaseBrowserClient();
      const [c,p] = await Promise.all([
        db.from("health_centers").select("id,name,city").eq("tenant_id",tenantId).order("name"),
        db.from("physicians").select("id,full_name,specialty,health_center_id").eq("tenant_id",tenantId).order("full_name")
      ]);
      if (!active) return;
      if (c.error || p.error) setError(c.error?.message ?? p.error?.message ?? "Error al cargar");
      else { setCenters((c.data ?? []) as Center[]); setPhysicians((p.data ?? []) as Physician[]); }
    })();
    return () => { active = false; };
  }, [tenantId,message]);
  async function addCenter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!tenantId || busy) return;
    const form = e.currentTarget; const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    if (name.length < 2) { setError("El nombre debe tener al menos dos caracteres."); return; }
    setBusy(true); setError(""); setMessage("");
    const { error: err } = await getSupabaseBrowserClient().from("health_centers").insert({tenant_id:tenantId,name,city:String(values.get("city") ?? "").trim() || null});
    if (err) setError(err.message); else { form.reset(); setMessage("Centro de salud guardado."); }
    setBusy(false);
  }
  async function addPhysician(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!tenantId || busy) return;
    const form = e.currentTarget; const values = new FormData(form);
    const full_name = String(values.get("full_name") ?? "").trim();
    if (full_name.length < 2) { setError("El nombre debe tener al menos dos caracteres."); return; }
    const health_center_id = String(values.get("health_center_id") ?? "") || null;
    setBusy(true); setError(""); setMessage("");
    const { error: err } = await getSupabaseBrowserClient().from("physicians").insert({tenant_id:tenantId,full_name,specialty:String(values.get("specialty") ?? "").trim() || null,health_center_id});
    if (err) setError(err.message); else { form.reset(); setMessage("Médico guardado."); }
    setBusy(false);
  }
  if (loading) return <main className="p-8">Cargando CRM...</main>;
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center justify-between"><h1 className="text-2xl font-bold">SIGVM · Gestión médica</h1><Link className="text-blue-700 underline" href="/dashboard">Volver al dashboard</Link></header>
      <label className="block">Empresa <select className="ml-2 rounded border p-2" value={tenantId} onChange={e=>{setTenantId(e.target.value);setMessage("");setError("");}}>{tenants.map(t=><option key={t.tenant_id} value={t.tenant_id}>{t.tenants?.display_name ?? "Empresa"}</option>)}</select></label>
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p role="status" className="rounded bg-green-50 p-3 text-green-700">{message}</p>}
      {!tenantId && <p>Primero crea una empresa desde el dashboard.</p>}
      {tenantId && <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border bg-white p-5"><h2 className="mb-4 text-xl font-semibold">Centros de salud</h2>
          <form onSubmit={addCenter} className="space-y-3">
            <label className="block">Nombre<input name="name" required maxLength={160} className="mt-1 w-full rounded border p-2"/></label>
            <label className="block">Ciudad<input name="city" maxLength={120} className="mt-1 w-full rounded border p-2"/></label>
            <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Guardar centro</button>
          </form>
          <ul className="mt-5 space-y-2">{centers.map(c=><li className="rounded border p-2" key={c.id}><strong>{c.name}</strong><p className="text-sm">{c.city}</p></li>)}</ul>
        </section>
        <section className="rounded-xl border bg-white p-5"><h2 className="mb-4 text-xl font-semibold">Médicos</h2>
          <form onSubmit={addPhysician} className="space-y-3">
            <label className="block">Nombre completo<input name="full_name" required maxLength={160} className="mt-1 w-full rounded border p-2"/></label>
            <label className="block">Especialidad<input name="specialty" maxLength={120} className="mt-1 w-full rounded border p-2"/></label>
            <label className="block">Centro de salud<select name="health_center_id" className="mt-1 w-full rounded border p-2"><option value="">Sin asignar</option>{centers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Guardar médico</button>
          </form>
          <ul className="mt-5 space-y-2">{physicians.map(p=><li className="rounded border p-2" key={p.id}><strong>{p.full_name}</strong><p className="text-sm">{p.specialty ?? "Sin especialidad"} · {centers.find(c=>c.id===p.health_center_id)?.name ?? "Sin centro"}</p></li>)}</ul>
        </section>
      </div>}
    </div>
  </main>;
}
