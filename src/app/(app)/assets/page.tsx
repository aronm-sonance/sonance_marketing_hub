import { createSupabaseServerClient } from '@/lib/supabase/server';
import AssetsUI from './ui';

export default async function AssetsPage() {
  const supabase = await createSupabaseServerClient();

  // Get initial assets (first page)
  const { data: initialAssets } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get all unique tags for filter
  const { data: allAssets } = await supabase
    .from('assets')
    .select('tags');

  const allTags = new Set<string>();
  allAssets?.forEach((asset: any) => {
    if (asset.tags && Array.isArray(asset.tags)) {
      asset.tags.forEach((tag: string) => allTags.add(tag));
    }
  });

  return (
    <AssetsUI
      initialAssets={initialAssets || []}
      allTags={Array.from(allTags).sort()}
    />
  );
}
