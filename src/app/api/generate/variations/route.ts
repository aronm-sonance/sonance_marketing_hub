import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/ai/prompt-builder';
import { getModelConfig } from '@/lib/ai/model-router';
import type { 
  Channel, 
  Platform, 
  BrandVoice,
  ChannelPlatformGuideline
} from '@/lib/ai/prompt-builder';
import type { DontSayRule } from '@/lib/ai/guardrails';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Response schema for variations
const variationsSchema = {
  type: SchemaType.OBJECT,
  properties: {
    variations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          content: {
            type: SchemaType.STRING,
            description: "The variation of the content",
            nullable: false,
          },
          tone_note: {
            type: SchemaType.STRING,
            description: "Brief note about the tone/approach of this variation",
            nullable: false,
          },
        },
        required: ["content", "tone_note"],
      },
    },
  },
  required: ["variations"],
};

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
    const { content, channel_id, platform_id, count = 3 } = body;

    if (!content || !channel_id || !platform_id) {
      return NextResponse.json(
        { error: 'Missing required fields: content, channel_id, platform_id' },
        { status: 400 }
      );
    }

    // Validate count
    const variationCount = Math.min(Math.max(1, parseInt(count)), 10);

    // Fetch channel details
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channel_id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Fetch platform details
    const { data: platform, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', platform_id)
      .single();

    if (platformError || !platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    // Fetch global brand voice
    const { data: brandVoice } = await supabase
      .from('brand_voice')
      .select('*')
      .eq('key', 'sonance-master')
      .maybeSingle();

    // Fetch channel-platform guidelines
    const { data: platformGuideline } = await supabase
      .from('channel_platform_guidelines')
      .select('*')
      .eq('channel_id', channel_id)
      .eq('platform_id', platform_id)
      .maybeSingle();

    // Fetch global dont_say rules
    const { data: globalDontSay } = await supabase
      .from('global_dont_say')
      .select('*')
      .eq('active', true);

    // Build variation prompt using the same pipeline
    const variationPrompt = buildVariationPrompt(
      content,
      variationCount,
      channel as Channel,
      platform as Platform,
      brandVoice as BrandVoice | undefined,
      platformGuideline as ChannelPlatformGuideline | undefined,
      (globalDontSay || []) as DontSayRule[]
    );

    // Get model configuration for content_variation task
    const modelConfig = getModelConfig('content_variation');

    // Initialize Gemini with structured output
    const model = genAI.getGenerativeModel({
      model: modelConfig.model,
      generationConfig: {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema: variationsSchema as any,
      },
    });

    // Generate variations
    const result = await model.generateContent(variationPrompt);
    const responseText = result.response.text();
    const variations = JSON.parse(responseText);

    // Return variations
    return NextResponse.json(variations);

  } catch (error: any) {
    console.error('Variation generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate variations' },
      { status: 500 }
    );
  }
}

function buildVariationPrompt(
  originalContent: string,
  count: number,
  channel: Channel,
  platform: Platform,
  brandVoice?: BrandVoice,
  platformGuideline?: ChannelPlatformGuideline,
  dontSayRules?: DontSayRule[]
): string {
  let prompt = '# Content Variation Generation\n\n';
  
  // Global brand voice context
  if (brandVoice) {
    prompt += '## Brand Voice\n\n';
    if (brandVoice.voice_foundation) {
      prompt += `${brandVoice.voice_foundation}\n\n`;
    }
    if (brandVoice.voice_attributes?.length > 0) {
      prompt += '### Voice Attributes:\n';
      for (const attr of brandVoice.voice_attributes) {
        prompt += `- **${attr.name}**: ${attr.description}\n`;
      }
      prompt += '\n';
    }
  }

  // Channel voice context
  prompt += `## Channel: ${channel.name}\n\n`;
  if (channel.voice_foundation) {
    prompt += `${channel.voice_foundation}\n\n`;
  }
  if (channel.voice_attributes?.length > 0) {
    prompt += '### Voice Attributes:\n';
    for (const attr of channel.voice_attributes) {
      prompt += `- **${attr.name}**: ${attr.description}\n`;
    }
    prompt += '\n';
  }

  // Platform context
  prompt += `## Platform: ${platform.name}\n\n`;
  if (platform.constraints) {
    const c = platform.constraints;
    prompt += '### Requirements:\n';
    if (c.max_chars) {
      prompt += `- Character limit: ${c.max_chars}\n`;
    }
    if (c.max_words) {
      prompt += `- Word limit: ${c.max_words}\n`;
    }
    if (c.format) {
      prompt += `- Format: ${c.format}\n`;
    }
    prompt += '\n';
  }

  // Platform guidelines
  if (platformGuideline) {
    if (platformGuideline.tone_adjustment) {
      prompt += `**Tone Adjustment**: ${platformGuideline.tone_adjustment}\n\n`;
    }
    if (platformGuideline.content_approach) {
      prompt += `**Content Approach**: ${platformGuideline.content_approach}\n\n`;
    }
  }

  // Guardrails
  if (dontSayRules && dontSayRules.length > 0) {
    prompt += '## Content Guardrails (Must Avoid)\n\n';
    for (const rule of dontSayRules) {
      prompt += `- ❌ "${rule.term}"`;
      if (rule.suggestion) {
        prompt += ` → Use: ${rule.suggestion}`;
      }
      prompt += '\n';
    }
    prompt += '\n';
  }

  if (channel.we_dont_say?.length > 0) {
    prompt += '## Channel Don\'t Say\n\n';
    for (const phrase of channel.we_dont_say) {
      prompt += `- ✗ ${phrase}\n`;
    }
    prompt += '\n';
  }

  // Original content
  prompt += '## Original Content\n\n';
  prompt += `${originalContent}\n\n`;

  // Task
  prompt += `## Task\n\n`;
  prompt += `Generate ${count} variations of the content above. Each variation should:\n`;
  prompt += '1. Maintain the core message and brand voice\n';
  prompt += '2. Use different wording, structure, or emphasis\n';
  prompt += '3. Stay within platform constraints\n';
  prompt += '4. Explore different tones or approaches (e.g., more energetic, more technical, more emotional)\n';
  prompt += '5. Avoid all guardrail terms and channel "don\'t say" phrases\n\n';
  prompt += 'Make each variation distinctly different from the others while maintaining brand alignment.\n';

  return prompt;
}
