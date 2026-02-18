"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
};

export default function UsersAdmin() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("viewer");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,status,created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setProfiles((data ?? []) as Profile[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName: fullName || undefined,
          role,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? json?.error ?? "Invite failed");

      setNotice(`Invite sent to ${email}`);
      setEmail("");
      setFullName("");
      setRole("viewer");
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium tracking-tight">Admin · Users</h1>
      <p className="mt-2 text-sm text-white/60">Create users and send set-password invites.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-medium">Invite user</div>
          <form onSubmit={invite} className="mt-4 space-y-3">
            <label className="block">
              <div className="text-xs text-white/60">Email</div>
              <input
                className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>

            <label className="block">
              <div className="text-xs text-white/60">Full name (optional)</div>
              <input
                className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="text-xs text-white/60">Role</div>
              <select
                className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="viewer">viewer</option>
                <option value="creator">creator</option>
                <option value="channel-lead">channel-lead</option>
                <option value="brand-marketer">brand-marketer</option>
                <option value="admin">admin</option>
              </select>
            </label>

            {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}
            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <button
              disabled={busy}
              className="w-full rounded-md bg-white text-black text-sm py-2 font-medium disabled:opacity-60"
              type="submit"
            >
              {busy ? "Sending…" : "Send invite"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-medium">Current users</div>
          <div className="mt-3 text-xs text-white/50">Profiles table (RLS-protected)</div>

          {loading ? (
            <p className="mt-4 text-sm text-white/60">Loading…</p>
          ) : error ? (
            <p className="mt-4 text-sm text-red-300">{error}</p>
          ) : (
            <div className="mt-4 space-y-2 max-h-[420px] overflow-auto pr-1">
              {profiles.map((p) => (
                <div key={p.id} className="rounded border border-white/10 bg-black/30 px-3 py-2">
                  <div className="text-sm text-white/90 truncate">{p.email}</div>
                  <div className="mt-1 text-[11px] text-white/50 flex gap-2">
                    <span className="capitalize">{p.role}</span>
                    <span>·</span>
                    <span className="capitalize">{p.status}</span>
                    {p.full_name ? (
                      <>
                        <span>·</span>
                        <span className="truncate">{p.full_name}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
              {profiles.length === 0 ? (
                <p className="text-sm text-white/60">No users found.</p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
