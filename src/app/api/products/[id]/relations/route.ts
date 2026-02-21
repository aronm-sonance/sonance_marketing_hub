import { NextRequest, NextResponse } from 'next/next';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { id } = params;

  // Join with salsify_products to get details of the target products
  const { data, error } = await supabase
    .from('salsify_product_relations')
    .select(`
      relation_type,
      target_product:salsify_products!target_product_id (
        id,
        sku,
        product_model,
        product_model_long,
        hero_image_url,
        hero_image_small_url
      )
    `)
    .eq('source_product_id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = {
    accessories: [] as any[],
    parts: [] as any[],
    system_components: [] as any[]
  };

  data?.forEach((item: any) => {
    const p = item.target_product;
    if (!p) return;
    
    switch (item.relation_type) {
      case 'Accessory':
        result.accessories.push(p);
        break;
      case 'Part':
        result.parts.push(p);
        break;
      case 'System Component':
        result.system_components.push(p);
        break;
    }
  });

  return NextResponse.json(result);
}
