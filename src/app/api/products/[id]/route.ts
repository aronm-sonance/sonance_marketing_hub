import { NextRequest, NextResponse } from 'next/next';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { id } = params;

  const { data, error } = await supabase
    .from('salsify_products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  // Strip raw_attributes as requested
  if (data) {
    delete data.raw_attributes;
  }

  return NextResponse.json(data);
}
