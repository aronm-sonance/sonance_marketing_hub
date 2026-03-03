import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import AiBudgetDashboard from "./ui";

export default async function AdminAiBudgetPage() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  return <AiBudgetDashboard />;
}
