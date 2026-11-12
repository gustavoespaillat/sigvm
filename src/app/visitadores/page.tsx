"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
type Tenant={tenant_id:string;tenants:{display_name:string}|null};
type Profile={user_id:string;display_name:string;employee_code:string|null};
export default function VisitadoresPage(){
 const router=useRouter();
 const [tenants,setTenants]=useState<Tenant[]>([]);
 const [tenantId,setTenantId]=useState("");
 const [userId,setUserId]=useState("");
 const [profiles,setProfiles]=useState<Profile[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let active=true;
  (async()=>{
   const db=getSupabaseBrowserClient();
   const {data:{user}}=await db.auth.getUser();
   if(!active)return;
   if(!user){router.replace("/login");return;}
   setUserId(user.id);
   const {data,error:e}=await db.from("tenant_memberships").select("tenant_id,tenants(display_name)").eq("user_id",user.id).eq("status","active");
   if(!active)return;
   if(e)setError("No se pudieron cargar tus empresas.");
   else{const list=(data??[]) as unknown as Tenant[];setTenants(list);setTenantId(list[0]?.tenant_id??"");}
   setLoading(false);
  })();
  return()=>{active=false;};
 },[router]);
 useEffect(()=>{
  if(!tenantId){setProfiles([]);return;}
  let active=true;
  (async()=>{
   const {data,error:e}=await getSupabaseBrowserClient().from("visitador_profiles").select("user_id,display_name,employee_code").eq("tenant_id",tenantId).order("display_name");
   if(!active)return;
   if(e)setError("No se pudo consultar el directorio.");else setProfiles((data??[]) as Profile[]);
  })();
  return()=>{active=false;};
 },[tenantId,revision]);
 const mine=profiles.find(p=>p.user_id===userId);
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||!tenantId||!userId)return;
  const form=e.currentTarget;const data=new FormData(form);
  const display_name=String(data.get("display_name")??"").trim();
  const employee_code=String(data.get("employee_code")??"").trim()||null;
  if(display_name.length<2){setError("Introduce un nombre de al menos dos caracteres.");return;}
  setBusy(true);setError("");setMessage("");
  const db=getSupabaseBrowserClient();
  const payload={display_name,employee_code,updated_at:new Date().toISOString()};
  const result=mine
   ? await db.from("visitador_profiles").update(payload).eq("tenant_id",tenantId).eq("user_id",userId)
   : await db.from("visitador_profiles").insert({tenant_id:tenantId,user_id:userId,...payload});
  if(result.error)setError("No se pudo guardar el perfil. Verifica que tu membresía esté activa.");
  else{form.reset();setMessage("Perfil guardado.");setRevision(n=>n+1);}
  setBusy(false);
 }
 if(loading)return <main className="p-8">Cargando perfiles...</main>;
 return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-4xl space-y-6">
  <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">SIGVM · Visitadores médicos</h1><nav className="flex gap-4"><Link href="/visitas" className="text-blue-700 underline">Visitas</Link><Link href="/dashboard" className="text-blue-700 underline">Dashboard</Link></nav></header>
  <label className="block">Empresa<select value={tenantId} onChange={e=>{setTenantId(e.target.value);setError("");setMessage("");}} className="ml-2 rounded border p-2">{tenants.map(t=><option key={t.tenant_id} value={t.tenant_id}>{t.tenants?.display_name??"Empresa"}</option>)}</select></label>
  {error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
  {message&&<p role="status" className="rounded bg-green-50 p-3 text-green-700">{message}</p>}
  {tenantId&&<div className="grid gap-6 md:grid-cols-2">
   <section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Mi perfil profesional</h2><p className="mt-2 text-sm text-slate-600">Solo puedes editar tus propios datos.</p>
    <form key={tenantId+String(revision)} onSubmit={save} className="mt-4 space-y-3">
     <label className="block">Nombre visible<input required minLength={2} maxLength={120} name="display_name" defaultValue={mine?.display_name??""} className="mt-1 w-full rounded border p-2"/></label>
     <label className="block">Código interno<input maxLength={80} name="employee_code" defaultValue={mine?.employee_code??""} className="mt-1 w-full rounded border p-2"/></label>
     <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">{busy?"Guardando...":"Guardar perfil"}</button>
    </form>
   </section>
   <section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Directorio de visitadores</h2>
    {profiles.length===0?<p className="mt-3 text-sm">Todavía no hay perfiles registrados.</p>:<ul className="mt-4 space-y-3">{profiles.map(p=><li key={p.user_id} className="rounded border p-3"><strong>{p.display_name}</strong><p className="text-sm text-slate-600">{p.employee_code??"Sin código"}{p.user_id===userId?" · Mi perfil":""}</p></li>)}</ul>}
   </section>
  </div>}
 </div></main>;
}