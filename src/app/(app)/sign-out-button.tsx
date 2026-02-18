"use client";

import { createBrowserClient } from "@supabase/ssr";

export default function SignOutButton() {
  async function signOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={signOut}
      className="mt-3 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
    >
      Sign out
    </button>
  );
}
