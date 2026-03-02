import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET - List user's workshop sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's workshop sessions (ordered by most recent)
    const { data: sessions, error } = await supabase
      .from('workshop_sessions')
      .select('id, title, channel_id, status, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching workshop sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workshop sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions });

  } catch (error: any) {
    console.error('Workshop sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workshop sessions' },
      { status: 500 }
    );
  }
}

// POST - Create a new workshop session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { title, channel_id } = body;

    // Validate channel_id if provided
    if (channel_id) {
      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('id', channel_id)
        .maybeSingle();

      if (!channel) {
        return NextResponse.json(
          { error: 'Invalid channel_id' },
          { status: 400 }
        );
      }
    }

    // Create new workshop session
    const { data: session, error } = await supabase
      .from('workshop_sessions')
      .insert({
        title: title || 'New Workshop Session',
        channel_id: channel_id || null,
        owner_id: user.id,
        status: 'active',
      })
      .select('id, title, channel_id, status, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating workshop session:', error);
      return NextResponse.json(
        { error: 'Failed to create workshop session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ session }, { status: 201 });

  } catch (error: any) {
    console.error('Workshop session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workshop session' },
      { status: 500 }
    );
  }
}
