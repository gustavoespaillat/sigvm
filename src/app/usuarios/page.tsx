"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
type Membership={tenant_id:string;tenants:{display_name:string}|null;roles:{code:string}|null};
export default function UsuariosPage(){
 const router=useRouter();
 const [owned,setOwned]=useState<Membership[]>([]);
 const [tenantId,setTenantId]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 useEffect(()=>{
  let active=true;
  (async()=>{
   const db=getSupabaseBrowserClient();
   const {data:{user}}=await db.auth.getUser();
   if(!active)return;
   if(!user){router.replace("/login");return;}
   const {data,error:e}=await db.from("tenant_memberships").select("tenant_id,tenants(display_name),roles(code)").eq("user_id",user.id).eq("status","active");
   if(!active)return;
   if(e)setError("No fue posible verificar tus permisos.");
   else{const list=((data??[]) as unknown as Membership[]).filter(m=>m.roles?.code==="tenant_owner");setOwned(list);setTenantId(list[0]?.tenant_id??"");}
   setLoading(false);
  })();
  return()=>{active=false;};
 },[router]);
 async function add(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||!tenantId)return;
  const form=e.currentTarget;
  const email=String(new FormData(form).get("email")??"").trim().toLowerCase();
  if(!email.includes("@")){setError("Introduce un correo válido.");return;}
  setBusy(true);setError("");setSuccess("");
  const {error:rpcError}=await getSupabaseBrowserClient().rpc("add_registered_visitador",{p_tenant_id:tenantId,p_email:email} as never);
  if(rpcError)setError("No se pudo agregar. Verifica que el usuario esté registrado, tenga su correo confirmado y no pertenezca ya a la empresa.");
  else{form.reset();setSuccess("Usuario agregado como visitador médico.");}
  setBusy(false);
 }
 if(loading)return <main className="p-8">Verificando permisos...</main>;
 return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-3xl space-y-6">
  <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">SIGVM · Usuarios de empresa</h1><Link className="text-blue-700 underline" href="/dashboard">Dashboard</Link></header>
  {error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
  {success&&<p role="status" className="rounded bg-green-50 p-3 text-green-700">{success}</p>}
  {owned.length===0?<p>Esta función está reservada al Administrador principal de una empresa.</p>:<section className="rounded-xl border bg-white p-5">
   <h2 className="text-xl font-semibold">Agregar usuario registrado</h2>
   <p className="mt-2 text-sm text-slate-600">El usuario debe tener una cuenta SIGVM con correo confirmado. Al agregarlo, tendrá acceso inmediato a los datos permitidos a los miembros de esta empresa. No se envía correo de invitación.</p>
   <label className="mt-4 block">Empresa<select className="mt-1 w-full rounded border p-2" value={tenantId} onChange={e=>setTenantId(e.target.value)}>{owned.map(t=><option key={t.tenant_id} value={t.tenant_id}>{t.tenants?.display_name??"Empresa"}</option>)}</select></label>
   <form onSubmit={add} className="mt-4 space-y-4"><label className="block">Correo del usuario<input type="email" required name="email" maxLength={254} placeholder="usuario@ejemplo.com" className="mt-1 w-full rounded border p-2"/></label>
    <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">{busy?"Agregando...":"Agregar como visitador médico"}</button>
   </form>
  </section>}
 </div></main>;
}