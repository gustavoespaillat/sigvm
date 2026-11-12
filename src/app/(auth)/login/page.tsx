"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: String(form.get("email")), password: String(form.get("password")),
      });
      if (authError) throw authError;
      router.push("/dashboard");
    } catch {
      setError("No fue posible iniciar sesión. Comprueba tus credenciales y confirma tu correo si corresponde.");
    } finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
    <section className="w-full max-w-md rounded-xl border bg-white p-8">
      <p className="font-bold text-blue-700">SIGVM</p><h1 className="mt-3 text-2xl font-bold">Iniciar sesión</h1>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">Correo<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded border p-2" /></label>
        <label className="block">Contraseña<input name="password" type="password" required minLength={10} autoComplete="current-password" className="mt-1 w-full rounded border p-2" /></label>
        <button disabled={busy} className="w-full rounded bg-blue-700 p-3 font-semibold text-white disabled:opacity-50">{busy ? "Entrando..." : "Entrar"}</button>
      </form>
      <p className="mt-5">¿No tienes cuenta? <Link className="text-blue-700" href="/registro">Regístrate</Link></p>
    </section>
  </main>;
}
