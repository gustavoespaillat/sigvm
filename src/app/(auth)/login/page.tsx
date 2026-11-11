import Link from "next/link";
import { loginAction } from "@/app/auth/actions";

type Props = { searchParams: Promise<{ error?: string; registered?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-widest text-blue-700">SIGVM</p>
        <h1 className="mt-3 text-2xl font-bold">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-slate-600">Accede al espacio de trabajo de tu empresa.</p>
        {params.registered && <p className="mt-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">Cuenta creada. Si la confirmación por correo está habilitada, confirma tu dirección antes de iniciar sesión.</p>}
        {params.error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">No fue posible iniciar sesión. Revisa los datos e inténtalo nuevamente.</p>}
        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium">Contraseña<input name="password" type="password" autoComplete="current-password" minLength={10} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <button className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800">Entrar</button>
        </form>
        <p className="mt-6 text-sm text-slate-600">¿No tienes cuenta? <Link className="font-semibold text-blue-700" href="/registro">Crear cuenta</Link></p>
      </section>
    </main>
  );
}
