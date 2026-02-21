import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";
import NotificationBell from "./notification-bell";

const navItems = [
  { href: "/", label: "Dashboard", icon: "◉" },
  { href: "/studio", label: "Content Studio", icon: "✦" },
  { href: "/workshop", label: "Creative Workshop", icon: "◈" },
  { href: "/library", label: "Content Library", icon: "▤" },
  { href: "/assets", label: "Assets", icon: "◧" },
  { href: "/analytics", label: "Analytics", icon: "◫" },
];

const adminItems = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/channels", label: "Channels" },
  { href: "/admin/platforms", label: "Platforms" },
  { href: "/admin/content-types", label: "Content Types" },
  { href: "/admin/dont-say", label: "Don't Say" },
  { href: "/admin/ai-usage", label: "AI Usage" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex min-h-screen bg-black text-white font-[family-name:var(--font-montserrat),ui-sans-serif,system-ui,sans-serif]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/10 bg-black shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="text-sm font-medium tracking-widest uppercase text-white/90">
            Son<span className="text-cyan-400">a</span>nce
          </div>
          <div className="text-[10px] text-white/40 tracking-wider uppercase mt-0.5">Marketing Hub</div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1.5 px-3">
                <div className="text-[10px] font-medium tracking-widest uppercase text-white/30">Admin</div>
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/50 truncate">{profile?.full_name ?? user.email}</div>
              <div className="text-[10px] text-white/30 capitalize">{profile?.role ?? "user"}</div>
            </div>
            <NotificationBell />
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

