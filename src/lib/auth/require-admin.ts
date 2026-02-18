import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, reason: "not_authenticated" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.status !== "active") return { ok: false as const, reason: "inactive" as const };
  if (profile?.role !== "admin") return { ok: false as const, reason: "not_admin" as const };

  return { ok: true as const, user };
}
