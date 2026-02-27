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
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Fetch all active dont_say_rules
    const { data: dontSayRules, error: rulesError } = await supabase
      .from('dont_say_rules')
      .select('*')
      .eq('active', true);

    if (rulesError) {
      console.error('Error fetching dont_say_rules:', rulesError);
      return NextResponse.json({ error: 'Failed to fetch guardrails' }, { status: 500 });
    }

    // Validate the content
    const validationResult = validateContent(content, (dontSayRules || []) as DontSayRule[]);

    return NextResponse.json(validationResult);

  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate content' },
      { status: 500 }
    );
  }
}
