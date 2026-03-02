import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateContent } from '@/lib/ai/guardrails';
import type { DontSayRule } from '@/lib/ai/guardrails';

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
    const { content, channel_id } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Fetch all active global_dont_say rules
    const { data: globalDontSay, error: rulesError } = await supabase
      .from('global_dont_say')
      .select('*')
      .eq('active', true);

    if (rulesError) {
      console.error('Error fetching global_dont_say:', rulesError);
      return NextResponse.json({ error: 'Failed to fetch guardrails' }, { status: 500 });
    }

    // Fetch channel-level "we_dont_say" if channel_id provided
    let channelDontSay: string[] = [];
    if (channel_id) {
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('we_dont_say')
        .eq('id', channel_id)
        .single();

      if (channelError) {
        console.warn('Error fetching channel dont_say rules:', channelError);
      } else if (channel?.we_dont_say) {
        channelDontSay = channel.we_dont_say;
      }
    }

    // Validate the content with both global and channel rules
    const validationResult = validateContent(
      content, 
      (globalDontSay || []) as DontSayRule[],
      channelDontSay
    );

    return NextResponse.json(validationResult);

  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate content' },
      { status: 500 }
    );
  }
}
