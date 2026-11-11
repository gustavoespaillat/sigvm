import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
        <p className="text-sm font-semibold tracking-widest text-blue-700">PLATAFORMA SAAS PARA EL SECTOR SALUD</p>
        <h1 className="mt-3 text-5xl font-bold">SIGVM</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">Sistema Inteligente de Gestión de Visita Médica.</p>
        <p className="mt-8 max-w-2xl text-slate-600">Organiza empresas, equipos comerciales y operaciones de visita médica en un entorno multiempresa con controles de acceso.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/registro" className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">Crear cuenta</Link>
          <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold">Iniciar sesión</Link>
        </div>
        <p className="mt-10 text-xs text-slate-500">Entorno inicial de desarrollo. No utilizar con datos clínicos o personales reales.</p>
      </section>
    </main>
  );
}
