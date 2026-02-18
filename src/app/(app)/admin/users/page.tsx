import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import UsersAdmin from "./ui";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  return <UsersAdmin />;
}
