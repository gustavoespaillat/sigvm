"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Tenant = { tenant_id: string; tenants: { display_name: string } | null };
type Territory = { id: string; name: string };
type Member = { user_id: string };
type StaffProfile = { user_id: string; display_name: string };
type Physician = { id: string; full_name: string };
type VisitEvent = { id: string; visit_id: string; previous_status: string | null; new_status: string; occurred_at: string };
type Visit = { id: string; physician_id: string; scheduled_at: string; status: string; notes: string | null };
export default function VisitsPage() {
 const router=useRouter();
 const [tenants,setTenants]=useState<Tenant[]>([]);
 const [tenantId,setTenantId]=useState("");
 const [physicians,setPhysicians]=useState<Physician[]>([]);
 const [territories,setTerritories]=useState<Territory[]>([]);
 const [members,setMembers]=useState<Member[]>([]);
 const [staffProfiles,setStaffProfiles]=useState<StaffProfile[]>([]);
 const [visits,setVisits]=useState<Visit[]>([]);
 const [events,setEvents]=useState<VisitEvent[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let active=true;
  (async()=>{
   const db=getSupabaseBrowserClient();
   const {data:{user}}=await db.auth.getUser();
   if(!active)return;
   if(!user){router.replace("/login");return;}
   const {data,error:e}=await db.from("tenant_memberships").select("tenant_id,tenants(display_name)").eq("user_id",user.id).eq("status","active");
   if(!active)return;
   if(e)setError("No se pudieron consultar tus empresas.");
   else {const list=(data??[]) as unknown as Tenant[];setTenants(list);setTenantId(list[0]?.tenant_id??"");}
   setLoading(false);
  })();
  return()=>{active=false;};
 },[router]);
 useEffect(()=>{
  if(!tenantId){setPhysicians([]);setVisits([]);setEvents([]);setTerritories([]);setMembers([]);setStaffProfiles([]);return;}
  let active=true;
  (async()=>{
   const db=getSupabaseBrowserClient();
   const [p,v,h,t,m,s]=await Promise.all([
    db.from("physicians").select("id,full_name").eq("tenant_id",tenantId).order("full_name"),
    db.from("medical_visits").select("id,physician_id,scheduled_at,status,notes").eq("tenant_id",tenantId).order("scheduled_at",{ascending:true}).limit(100),
    db.from("medical_visit_events").select("id,visit_id,previous_status,new_status,occurred_at").eq("tenant_id",tenantId).order("occurred_at",{ascending:false}).limit(30),
    db.from("territories").select("id,name").eq("tenant_id",tenantId).order("name"),
    db.from("tenant_memberships").select("user_id").eq("tenant_id",tenantId).eq("status","active"),
    db.from("visitador_profiles").select("user_id,display_name").eq("tenant_id",tenantId)
   ]);
   if(!active)return;
   if(p.error||v.error||h.error||t.error||m.error||s.error)setError("No fue posible consultar toda la información de visitas.");
   else {setPhysicians((p.data??[]) as Physician[]);setVisits((v.data??[]) as Visit[]);setEvents((h.data??[]) as VisitEvent[]);setTerritories((t.data??[]) as Territory[]);setMembers((m.data??[]) as Member[]);setStaffProfiles((s.data??[]) as StaffProfile[]);}
  })();
  return()=>{active=false;};
 },[tenantId,revision]);
 async function createVisit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!tenantId)return;
  const form=event.currentTarget;const data=new FormData(form);
  const physician_id=String(data.get("physician_id")??"");
  const localDate=String(data.get("scheduled_at")??"");
  const notes=String(data.get("notes")??"").trim();
  const assigned_to=String(data.get("assigned_to")??"")||null;
  const territory_id=String(data.get("territory_id")??"")||null;
  if(!physicians.some(p=>p.id===physician_id)||!localDate||!Number.isFinite(new Date(localDate).getTime())){setError("Selecciona un médico y una fecha válida.");return;}
  setBusy(true);setError("");setSuccess("");
  const {error:e}=await getSupabaseBrowserClient().from("medical_visits").insert({tenant_id:tenantId,physician_id,scheduled_at:new Date(localDate).toISOString(),notes:notes||null,assigned_to,territory_id});
  if(e)setError("No se pudo programar la visita. Comprueba tus permisos.");
  else {form.reset();setSuccess("Visita programada correctamente.");setRevision(n=>n+1);}
  setBusy(false);
 }
 async function changeStatus(visit:Visit,status:"completed"|"cancelled") {
  if(busy||visit.status!=="planned"||!tenantId)return;
  setBusy(true);setError("");setSuccess("");
  const {data,error:e}=await getSupabaseBrowserClient().from("medical_visits")
   .update({status}).eq("id",visit.id).eq("tenant_id",tenantId).eq("status","planned").select("id");
  if(e||!data?.length)setError("No se pudo actualizar la visita. Comprueba los permisos o el estado actual.");
  else {setSuccess(status==="completed"?"Visita completada.":"Visita cancelada.");setRevision(n=>n+1);}
  setBusy(false);
 }
 if(loading)return <main className="p-8">Cargando visitas...</main>;
 return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-5xl space-y-6">
  <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">SIGVM · Visitas médicas</h1><nav className="flex gap-4"><Link className="text-blue-700 underline" href="/crm">Médicos y centros</Link><Link className="text-blue-700 underline" href="/territorios">Territorios</Link><Link className="text-blue-700 underline" href="/visitadores">Visitadores</Link><Link className="text-blue-700 underline" href="/dashboard">Dashboard</Link></nav></header>
  <label className="block">Empresa <select className="ml-2 rounded border p-2" value={tenantId} onChange={e=>{setTenantId(e.target.value);setError("");setSuccess("");}}>{tenants.map(t=><option key={t.tenant_id} value={t.tenant_id}>{t.tenants?.display_name??"Empresa"}</option>)}</select></label>
  {error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
  {success&&<p role="status" className="rounded bg-green-50 p-3 text-green-700">{success}</p>}
  {tenantId&&<div className="grid grid-cols-3 gap-3 text-center">{(["planned","completed","cancelled"] as const).map((status,i)=><div key={status} className="rounded border bg-white p-3"><p className="text-2xl font-bold">{visits.filter(v=>v.status===status).length}</p><p className="text-sm">{["Programadas","Completadas","Canceladas"][i]}</p></div>)}</div>}
  {!tenantId?<p>Primero crea una empresa desde el dashboard.</p>:<div className="grid gap-6 md:grid-cols-2">
   <section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">Programar visita</h2>
    {physicians.length===0?<p className="mt-3">Registra primero un médico en el módulo CRM.</p>:<form onSubmit={createVisit} className="mt-4 space-y-4">
     <label className="block">Médico<select required name="physician_id" defaultValue="" className="mt-1 w-full rounded border p-2"><option value="" disabled>Seleccionar médico</option>{physicians.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label>
     <label className="block">Fecha y hora<input required type="datetime-local" name="scheduled_at" className="mt-1 w-full rounded border p-2"/></label>
     <label className="block">Responsable<select name="assigned_to" className="mt-1 w-full rounded border p-2"><option value="">Sin asignar</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{staffProfiles.find(p=>p.user_id===m.user_id)?.display_name??("Usuario "+m.user_id.slice(0,8))}</option>)}</select></label>
     <label className="block">Territorio<select name="territory_id" className="mt-1 w-full rounded border p-2"><option value="">Sin territorio</option>{territories.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
     <label className="block">Observaciones<textarea name="notes" maxLength={2000} rows={3} className="mt-1 w-full rounded border p-2"/></label>
     <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">{busy?"Guardando...":"Programar visita"}</button>
    </form>}
   </section>
   <section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">Visitas programadas</h2>
    {visits.length===0?<p className="mt-3">Todavía no hay visitas registradas.</p>:<ul className="mt-4 space-y-3">{visits.map(v=><li key={v.id} className="rounded border p-3"><strong>{physicians.find(p=>p.id===v.physician_id)?.full_name??"Médico"}</strong><p>{new Date(v.scheduled_at).toLocaleString("es-DO")}</p><p className="text-sm">Estado: {v.status==="planned"?"Programada":v.status==="completed"?"Completada":"Cancelada"}</p>{v.notes&&<p className="mt-1 text-sm">{v.notes}</p>}{v.status==="planned"&&<div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={()=>changeStatus(v,"completed")} className="rounded bg-green-700 px-3 py-1 text-white disabled:opacity-50">Completar</button><button type="button" disabled={busy} onClick={()=>changeStatus(v,"cancelled")} className="rounded border px-3 py-1 disabled:opacity-50">Cancelar</button></div>}</li>)}</ul>}
   </section>
  </div>}
 </div></main>;
}
