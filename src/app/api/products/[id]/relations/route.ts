import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  // Get relations for this product
  const { data: rels, error } = await supabase
    .from('salsify_product_relations')
    .select('target_product_id, relation_type')
    .eq('source_product_id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result: Record<string, any[]> = {
    accessories: [],
    parts: [],
    system_components: []
  };

  if (!rels || rels.length === 0) {
    return NextResponse.json(result);
  }

  // Fetch target product details
  const targetIds = [...new Set(rels.map(r => r.target_product_id))];
  const { data: targets } = await supabase
    .from('salsify_products')
    .select('id, sku, product_model, product_model_long, hero_image_url, hero_image_small_url')
    .in('id', targetIds);

  const targetMap = new Map((targets || []).map(t => [t.id, t]));

  rels.forEach((rel) => {
    const p = targetMap.get(rel.target_product_id);
    if (!p) return;
    switch (rel.relation_type) {
      case 'Accessory': result.accessories.push(p); break;
      case 'Part': result.parts.push(p); break;
      case 'System Component': result.system_components.push(p); break;
    }
  });

  return NextResponse.json(result);
}
