import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import ContentTypesAdmin from "./ui";

export default async function AdminContentTypesPage() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  return <ContentTypesAdmin />;
}
