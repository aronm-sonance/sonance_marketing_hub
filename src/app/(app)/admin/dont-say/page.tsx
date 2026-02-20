import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import DontSayAdmin from "./ui";

export default async function AdminDontSayPage() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  return <DontSayAdmin />;
}
