import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const source = searchParams.get('source') || '';
    const tag = searchParams.get('tag') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('assets')
      .select('*', { count: 'exact' });

    // Filter by search query (name or tags)
    if (q) {
      query = query.or(`name.ilike.%${q}%,tags.cs.{${q}}`);
    }

    // Filter by source
    if (source) {
      query = query.eq('source', source);
    }

    // Filter by tag
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Sort
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: assets, error, count } = await query;

    if (error) {
      console.error('Error fetching assets:', error);
      return NextResponse.json(
        { error: `Failed to fetch assets: ${error.message}` },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      assets: assets || [],
      total: count || 0,
      pages: totalPages,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Error in GET /api/assets:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      storage_path,
      source = 'upload',
      tags = [],
      salsify_id = null,
      salsify_field = null,
    } = body;

    if (!name || !storage_path) {
      return NextResponse.json(
        { error: 'name and storage_path are required' },
        { status: 400 }
      );
    }

    // Create asset record
    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        name,
        storage_path,
        source,
        tags,
        salsify_id,
        salsify_field,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating asset:', error);
      return NextResponse.json(
        { error: `Failed to create asset: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, asset }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/assets:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
