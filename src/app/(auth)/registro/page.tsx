import Link from "next/link";
import { registerAction } from "@/app/auth/actions";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-widest text-blue-700">SIGVM</p>
        <h1 className="mt-3 text-2xl font-bold">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">Registra tu usuario para iniciar la configuración de tu empresa.</p>
        {params.error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">No fue posible completar el registro. Verifica los datos o consulta al administrador.</p>}
        <form action={registerAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Nombre completo<input name="fullName" autoComplete="name" minLength={2} maxLength={120} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium">Contraseña<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /><span className="mt-1 block text-xs text-slate-500">Mínimo 10 caracteres.</span></label>
          <button className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800">Crear cuenta</button>
        </form>
        <p className="mt-6 text-sm text-slate-600">¿Ya tienes cuenta? <Link className="font-semibold text-blue-700" href="/login">Iniciar sesión</Link></p>
      </section>
    </main>
  );
}
