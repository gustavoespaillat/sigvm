"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
type Tenant = { tenant_id:string; tenants:{display_name:string}|null };
type Territory = {id:string;name:string};
export default function TerritoriesPage(){
 const router=useRouter();
 const [tenants,setTenants]=useState<Tenant[]>([]);
 const [tenantId,setTenantId]=useState("");
 const [items,setItems]=useState<Territory[]>([]);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
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
   if(e)setError("No fue posible consultar empresas.");
   else {const list=(data??[]) as unknown as Tenant[];setTenants(list);setTenantId(list[0]?.tenant_id??"");}
   setLoading(false);
  })();
  return()=>{active=false;};
 },[router]);
 useEffect(()=>{
  if(!tenantId){setItems([]);return;}
  let active=true;
  (async()=>{
   const {data,error:e}=await getSupabaseBrowserClient().from("territories").select("id,name").eq("tenant_id",tenantId).order("name");
   if(!active)return;
   if(e)setError("No se pudieron consultar los territorios.");else setItems((data??[]) as Territory[]);
  })();
  return()=>{active=false;};
 },[tenantId,revision]);
 async function add(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||!tenantId)return;
  const form=e.currentTarget;const name=String(new FormData(form).get("name")??"").trim();
  if(name.length<2){setError("Introduce un nombre válido.");return;}
  setBusy(true);setError("");setMessage("");
  const {error:err}=await getSupabaseBrowserClient().from("territories").insert({tenant_id:tenantId,name});
  if(err)setError("No se pudo crear el territorio. Comprueba si ya existe.");
  else {form.reset();setMessage("Territorio creado.");setRevision(n=>n+1);}
  setBusy(false);
 }
 if(loading)return <main className="p-8">Cargando territorios...</main>;
 return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-3xl space-y-6">
 <header className="flex justify-between gap-4"><h1 className="text-2xl font-bold">SIGVM · Territorios</h1><Link href="/visitas" className="text-blue-700 underline">Volver a visitas</Link></header>
 <label>Empresa <select className="ml-2 rounded border p-2" value={tenantId} onChange={e=>setTenantId(e.target.value)}>{tenants.map(t=><option key={t.tenant_id} value={t.tenant_id}>{t.tenants?.display_name??"Empresa"}</option>)}</select></label>
 {error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
 {message&&<p role="status" className="rounded bg-green-50 p-3 text-green-700">{message}</p>}
 {tenantId&&<section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Nuevo territorio</h2><form onSubmit={add} className="mt-3 flex flex-wrap gap-3"><input name="name" required minLength={2} maxLength={120} placeholder="Ej. Santiago Norte" className="flex-1 rounded border p-2"/><button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Guardar</button></form>
 <h2 className="mt-6 text-lg font-semibold">Territorios registrados</h2><ul className="mt-3 space-y-2">{items.map(t=><li key={t.id} className="rounded border p-3">{t.name}</li>)}</ul>{items.length===0&&<p className="mt-2 text-sm">No hay territorios todavía.</p>}</section>}
 </div></main>;
}