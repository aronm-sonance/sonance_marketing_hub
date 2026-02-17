import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-medium tracking-tight">Sonance Marketing Hub</h1>
      <p className="mt-2 text-sm text-white/70">You’re signed in as {data.user?.email}.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Progress</div>
          <div className="mt-2 text-sm">Phase 1 is in progress: migrations + RLS + admin UI scaffolding.</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Docs</div>
          <p className="mt-2 text-sm text-white/70">
            Execution spec is committed in <code className="text-white">docs/SPEC.md</code>.
          </p>
        </div>
      </div>
    </main>
  );
}
