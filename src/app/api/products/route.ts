import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q');
  const brand = searchParams.get('brand');
  const category = searchParams.get('category');
  const type = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  let dbQuery = supabase
    .from('salsify_products')
    .select('id, sku, product_model, product_model_long, brand, category, hero_image_url, description_long, type', { count: 'exact' });

  if (query) {
    dbQuery = dbQuery.textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english'
    });
  }

  if (brand) dbQuery = dbQuery.eq('brand', brand);
  if (category) dbQuery = dbQuery.eq('category', category);
  if (type) dbQuery = dbQuery.eq('type', type);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await dbQuery
    .order('product_model', { ascending: true })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count || 0;
  const pages = Math.ceil(total / limit);

  return NextResponse.json({
    products: data,
    total,
    page,
    pages
  });
}
