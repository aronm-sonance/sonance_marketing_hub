import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get('status');
  const channel = searchParams.get('channel_id');
  const platform = searchParams.get('platform_id');
  const search = searchParams.get('search');

  let query = supabase
    .from('posts')
    .select(`
      *,
      channels(name),
      platforms(name),
      content_types(name)
    `)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (channel) query = query.eq('channel_id', channel);
  if (platform) query = query.eq('platform_id', platform);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('posts')
    .insert([{ ...body, author_id: user.id, status: 'draft' }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
