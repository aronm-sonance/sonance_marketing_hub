import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import { SalsifyAdminUI } from "./ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SalsifyAdminPage() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/");
  
  const supabase = await createSupabaseServerClient();
  
  // Fetch last import stats
  const { data: lastImport } = await supabase
    .from('salsify_import_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch product count by brand
  // Note: PostgREST doesn't support grouping well for summaries in a single call without RPC, 
  // but we can do a quick select of all brands and count them in memory or just fetch unique brands.
  const { data: brandsData } = await supabase
    .from('salsify_products')
    .select('brand');
    
  const brandCounts: Record<string, number> = {};
  brandsData?.forEach(p => {
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  });

  return <SalsifyAdminUI lastImport={lastImport} brandCounts={brandCounts} />;
}
