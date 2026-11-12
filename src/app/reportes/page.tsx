"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Tenant = { tenant_id: string; tenants: { display_name: string } | null };
type Territory = { id: string; name: string };
type Visit = { id: string; scheduled_at: string; status: string; territory_id: string | null; assigned_to: string | null };
type Member = { user_id: string };
export default function ReportsPage() {
 const router = useRouter();
 const [tenants, setTenants] = useState<Tenant[]>([]);
 const [tenantId, setTenantId] = useState("");
 const [territories, setTerritories] = useState<Territory[]>([]);
 const [members, setMembers] = useState<Member[]>([]);
 const [visits, setVisits] = useState<Visit[]>([]);
 const [territoryFilter, setTerritoryFilter] = useState("");
 const [memberFilter, setMemberFilter] = useState("");
 const [from, setFrom] = useState("");
 const [to, setTo] = useState("");
 const [loading, setLoading] = useState(true);
 const [loadingData, setLoadingData] = useState(false);
 const [error, setError] = useState("");
 const [limited, setLimited] = useState(false);
 useEffect(() => {
  let active = true;
  (async () => {
   const db = getSupabaseBrowserClient();
   const { data: { user } } = await db.auth.getUser();
   if (!active) return;
   if (!user) { router.replace("/login"); return; }
   const { data, error: e } = await db.from("tenant_memberships").select("tenant_id,tenants(display_name)").eq("user_id",user.id).eq("status","active");
   if (!active) return;
   if (e) setError("No se pudieron cargar tus empresas.");
   else { const list = (data ?? []) as unknown as Tenant[]; setTenants(list); setTenantId(list[0]?.tenant_id ?? ""); }
   setLoading(false);
  })();
  return () => { active = false; };
 }, [router]);
 useEffect(() => {
  if (!tenantId) { setVisits([]); setTerritories([]); setMembers([]); return; }
  let active = true;
  setLoadingData(true);
  setError("");
  (async () => {
   const db = getSupabaseBrowserClient();
   const [t, m, v] = await Promise.all([
    db.from("territories").select("id,name").eq("tenant_id",tenantId).order("name"),
    db.from("tenant_memberships").select("user_id").eq("tenant_id",tenantId).eq("status","active"),
    db.from("medical_visits").select("id,scheduled_at,status,territory_id,assigned_to").eq("tenant_id",tenantId).order("scheduled_at",{ascending:false}).limit(1000)
   ]);
   if (!active) return;
   if (t.error || m.error || v.error) setError("No se pudieron cargar los datos del reporte.");
   else {
    setTerritories((t.data ?? []) as Territory[]);
    setMembers((m.data ?? []) as Member[]);
    setVisits((v.data ?? []) as Visit[]);
    setLimited((v.data ?? []).length === 1000);
   }
   setLoadingData(false);
  })();
  return () => { active = false; };
 }, [tenantId]);
 const filtered = useMemo(() => visits.filter(v => {
  const day = v.scheduled_at.slice(0,10);
  return (!territoryFilter || v.territory_id === territoryFilter) &&
   (!memberFilter || v.assigned_to === memberFilter) &&
   (!from || day >= from) && (!to || day <= to);
 }), [visits,territoryFilter,memberFilter,from,to]);
 const planned = filtered.filter(v => v.status === "planned").length;
 const completed = filtered.filter(v => v.status === "completed").length;
 const cancelled = filtered.filter(v => v.status === "cancelled").length;
 const rate = filtered.length ? Math.round(completed / filtered.length * 100) : 0;
 const byTerritory = territories.map(t => ({
  name:t.name,
  count:filtered.filter(v=>v.territory_id===t.id).length,
  completed:filtered.filter(v=>v.territory_id===t.id && v.status==="completed").length
 })).filter(t=>t.count>0);
 const byMember = members.map(m => ({
  id:m.user_id,
  count:filtered.filter(v=>v.assigned_to===m.user_id).length,
  completed:filtered.filter(v=>v.assigned_to===m.user_id && v.status==="completed").length
 })).filter(m=>m.count>0);
 if (loading) return <main className="p-8">Cargando reportes...</main>;
 return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-6xl space-y-6">
  <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">SIGVM · Reportes de visitas</h1><nav className="flex gap-4"><Link href="/visitas" className="text-blue-700 underline">Visitas</Link><Link href="/dashboard" className="text-blue-700 underline">Dashboard</Link></nav></header>
  <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3">
   <label>Empresa<select className="mt-1 w-full rounded border p-2" value={tenantId} onChange={e=>{setTenantId(e.target.value);setTerritoryFilter("");setMemberFilter("");}}>{tenants.map(t=><option key={t.tenant_id} value={t.tenant_id}>{t.tenants?.display_name??"Empresa"}</option>)}</select></label>
   <label>Territorio<select className="mt-1 w-full rounded border p-2" value={territoryFilter} onChange={e=>setTerritoryFilter(e.target.value)}><option value="">Todos</option>{territories.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
   <label>Responsable<select className="mt-1 w-full rounded border p-2" value={memberFilter} onChange={e=>setMemberFilter(e.target.value)}><option value="">Todos</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.user_id.slice(0,8)}</option>)}</select></label>
   <label>Desde<input type="date" className="mt-1 w-full rounded border p-2" value={from} onChange={e=>setFrom(e.target.value)}/></label>
   <label>Hasta<input type="date" className="mt-1 w-full rounded border p-2" value={to} onChange={e=>setTo(e.target.value)}/></label>
  </div>
  {error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
  {loadingData&&<p>Actualizando indicadores...</p>}
  {limited&&<p className="rounded bg-amber-50 p-3 text-amber-900">Reporte parcial: se consultaron las 1,000 visitas más recientes. Los indicadores no representan todo el historial.</p>}
  {!tenantId?<p>Primero crea una empresa.</p>:<div className="grid grid-cols-2 gap-3 md:grid-cols-5">
   {([["Total",filtered.length],["Programadas",planned],["Completadas",completed],["Canceladas",cancelled],["Cumplimiento",rate+"%"]] as const).map(([label,value])=><div key={label} className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}
  </div>}
  {tenantId&&<div className="grid gap-6 md:grid-cols-2">
   <section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Por territorio</h2><div className="mt-4 space-y-3">{byTerritory.map(t=><div key={t.name} className="border-b pb-2"><strong>{t.name}</strong><p className="text-sm">{t.count} visitas · {t.completed} completadas</p><div className="mt-1 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-blue-700" style={{width: (t.count?100*t.completed/t.count:0)+"%"}}/></div></div>)}{byTerritory.length===0&&<p className="text-sm">Sin visitas asociadas a territorios.</p>}</div></section>
   <section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Por responsable</h2><div className="mt-4 space-y-3">{byMember.map(m=><div key={m.id} className="border-b pb-2"><strong>Usuario {m.id.slice(0,8)}</strong><p className="text-sm">{m.count} visitas · {m.completed} completadas</p></div>)}{byMember.length===0&&<p className="text-sm">Sin visitas asignadas.</p>}</div></section>
  </div>}
  <p className="text-sm text-slate-500">Cumplimiento = visitas completadas / visitas registradas en el período seleccionado. Los filtros de fecha se aplican sobre la fecha UTC almacenada.</p>
 </div></main>;
}
