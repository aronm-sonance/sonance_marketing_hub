"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <div className="text-xs text-white/70">Email</div>
        <input
          className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="block">
        <div className="text-xs text-white/70">Password</div>
        <input
          className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-white text-black text-sm py-2 font-medium disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-xs text-white/50">
        Accounts are created by admins. If you don’t have a login yet, contact an admin.
      </p>
    </form>
  );
}
