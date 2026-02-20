import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import ChannelsAdmin from "./ui";

export default async function AdminChannelsPage() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  return <ChannelsAdmin />;
}
