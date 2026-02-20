import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import PlatformsAdmin from "./ui";

export default async function AdminPlatformsPage() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  return <PlatformsAdmin />;
}
