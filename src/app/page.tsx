export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
        <p className="text-sm font-semibold tracking-widest text-blue-700">PLATAFORMA SAAS</p>
        <h1 className="mt-3 text-5xl font-bold">SIGVM</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Sistema Inteligente de Gestión de Visita Médica.
        </p>
        <p className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Entorno inicial de desarrollo. Conecta Supabase y completa la autenticación
          antes de habilitar operaciones empresariales.
        </p>
      </section>
    </main>
  );
}
