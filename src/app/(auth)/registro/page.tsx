"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AuthApiError } from "@supabase/supabase-js";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName")).trim();
    if (fullName.length < 2) { setError("Introduce tu nombre completo."); setBusy(false); return; }
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signUp({
        email: String(form.get("email")), password: String(form.get("password")),
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin + "/sigvm/login/" },
      });
      if (authError) throw authError;
      setMessage("Solicitud de registro recibida. Revisa tu correo para confirmar la cuenta, si se requiere.");
    } catch (cause) {
      if (cause instanceof AuthApiError && (cause.code === "over_email_send_rate_limit" || cause.status === 429)) {
        setError("Se alcanzó temporalmente el límite de correos de confirmación. Espera antes de volver a intentarlo o contacta al administrador.");
      } else if (cause instanceof AuthApiError && cause.code === "email_address_invalid") {
        setError("La dirección de correo no es válida.");
      } else {
        setError("No se pudo completar el registro. Comprueba la configuración de autenticación o consulta al administrador.");
      }
    }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
    <section className="w-full max-w-md rounded-xl border bg-white p-8">
      <p className="font-bold text-blue-700">SIGVM</p><h1 className="mt-3 text-2xl font-bold">Crear cuenta</h1>
      {message && <p role="status" className="mt-4 text-green-700">{message}</p>}
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">Nombre completo<input name="fullName" required minLength={2} maxLength={120} autoComplete="name" className="mt-1 w-full rounded border p-2" /></label>
        <label className="block">Correo<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded border p-2" /></label>
        <label className="block">Contraseña<input name="password" type="password" required minLength={10} maxLength={72} autoComplete="new-password" className="mt-1 w-full rounded border p-2" /></label>
        <button disabled={busy} className="w-full rounded bg-blue-700 p-3 font-semibold text-white disabled:opacity-50">{busy ? "Registrando..." : "Crear cuenta"}</button>
      </form>
      <p className="mt-5">¿Ya tienes cuenta? <Link className="text-blue-700" href="/login">Iniciar sesión</Link></p>
    </section>
  </main>;
}
