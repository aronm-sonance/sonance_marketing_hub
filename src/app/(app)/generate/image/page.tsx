import { createSupabaseServerClient } from '@/lib/supabase/server';
import ImageGeneratorUI from './ui';

export default async function ImageGeneratorPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch channels for dropdown
  const { data: channels } = await supabase
    .from('channels')
    .select('id, name, visual_scenes')
    .order('name');

  // Fetch products for optional product context
  const { data: products } = await supabase
    .from('products')
    .select('id, product_model, brand, category')
    .order('product_model')
    .limit(100);

  return (
    <ImageGeneratorUI
      channels={channels || []}
      products={products || []}
    />
  );
}
