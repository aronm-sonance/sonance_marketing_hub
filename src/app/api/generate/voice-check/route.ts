import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getModelConfig } from '@/lib/ai/model-router';
import { validateContent } from '@/lib/ai/guardrails';
import type { Channel, BrandVoice } from '@/lib/ai/prompt-builder';
import type { DontSayRule } from '@/lib/ai/guardrails';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Response schema for structured output
const voiceCheckSchema = {
  type: SchemaType.OBJECT,
  properties: {
    overall_score: {
      type: SchemaType.NUMBER,
      description: "Overall brand voice alignment score from 0-100",
      nullable: false,
    },
    alignment_summary: {
      type: SchemaType.STRING,
      description: "1-2 sentence overall assessment of brand voice alignment",
      nullable: false,
    },
    attribute_scores: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          attribute: {
            type: SchemaType.STRING,
            description: "Voice attribute name",
            nullable: false,
          },
          score: {
            type: SchemaType.NUMBER,
            description: "Score from 0-100 for this attribute",
            nullable: false,
          },
          feedback: {
            type: SchemaType.STRING,
            description: "Specific feedback for this attribute",
            nullable: false,
          },
        },
        required: ["attribute", "score", "feedback"],
      },
    },
    violations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: {
            type: SchemaType.STRING,
            description: "The problematic phrase",
            nullable: false,
          },
          issue: {
            type: SchemaType.STRING,
            description: "Why it's a problem",
            nullable: false,
          },
          suggestion: {
            type: SchemaType.STRING,
            description: "What to use instead",
            nullable: false,
          },
        },
        required: ["text", "issue", "suggestion"],
      },
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
        description: "What the content does well",
      },
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
        description: "Specific improvement suggestions",
      },
    },
  },
  required: [
    "overall_score",
    "alignment_summary",
    "attribute_scores",
    "violations",
    "strengths",
    "recommendations",
  ],
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
    const { content, channel_id } = body;

    if (!content || !channel_id) {
      return NextResponse.json(
        { error: 'Missing required fields: content, channel_id' },
        { status: 400 }
      );
    }

    // Fetch channel details with full voice data
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channel_id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Fetch global brand voice (handle gracefully if missing)
    const { data: brandVoice } = await supabase
      .from('brand_voice')
      .select('*')
      .eq('key', 'sonance-master')
      .maybeSingle();

    // Fetch global dont_say rules
    const { data: globalDontSay } = await supabase
      .from('global_dont_say')
      .select('*')
      .eq('active', true);

    // Run guardrails validation
    const guardrailsResult = validateContent(
      content,
      (globalDontSay || []) as DontSayRule[],
      channel.we_dont_say || []
    );

    // Build voice check prompt
    const systemPrompt = buildVoiceCheckPrompt(
      content,
      channel as Channel,
      brandVoice as BrandVoice | undefined
    );

    // Get model configuration for voice_check task
    const modelConfig = getModelConfig('voice_check');

    // Initialize Gemini with structured output
    const model = genAI.getGenerativeModel({
      model: modelConfig.model,
      generationConfig: {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema: voiceCheckSchema as any,
      },
    });

    // Generate voice check analysis
    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const voiceCheckResult = JSON.parse(responseText);

    // Merge guardrails violations with AI-detected violations
    const mergedViolations = [
      ...voiceCheckResult.violations,
      ...guardrailsResult.violations.map(v => ({
        text: v.matched_text,
        issue: v.severity === 'error' 
          ? 'Violates critical content guardrail' 
          : 'Violates channel voice guideline',
        suggestion: v.suggestion || 'Remove or rephrase this term',
      })),
    ];

    // Return combined result
    return NextResponse.json({
      ...voiceCheckResult,
      violations: mergedViolations,
      guardrails_valid: guardrailsResult.valid,
    });

  } catch (error: any) {
    console.error('Voice check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check voice alignment' },
      { status: 500 }
    );
  }
}

function buildVoiceCheckPrompt(
  content: string,
  channel: Channel,
  brandVoice?: BrandVoice
): string {
  let prompt = '# Brand Voice Alignment Check\n\n';
  prompt += 'You are a brand voice expert evaluating content alignment with the Sonance brand voice.\n\n';

  // Global brand voice
  if (brandVoice) {
    prompt += '## Global Brand Voice\n\n';
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

  // Channel voice
  prompt += `## Channel: ${channel.name}\n\n`;
  if (channel.voice_foundation) {
    prompt += `${channel.voice_foundation}\n\n`;
  }
  if (channel.voice_attributes?.length > 0) {
    prompt += '### Channel Voice Attributes:\n';
    for (const attr of channel.voice_attributes) {
      prompt += `- **${attr.name}**: ${attr.description}\n`;
      if (attr.sounds_like && attr.sounds_like.length > 0) {
        prompt += `  - Sounds like: ${attr.sounds_like.map(s => `"${s}"`).join(', ')}\n`;
      }
      if (attr.avoid && attr.avoid.length > 0) {
        prompt += `  - Avoid: ${attr.avoid.map(a => `"${a}"`).join(', ')}\n`;
      }
    }
    prompt += '\n';
  }

  if (channel.we_say?.length > 0) {
    prompt += '### We Say:\n';
    for (const phrase of channel.we_say) {
      prompt += `- ✓ ${phrase}\n`;
    }
    prompt += '\n';
  }

  if (channel.we_dont_say?.length > 0) {
    prompt += '### We Don\'t Say:\n';
    for (const phrase of channel.we_dont_say) {
      prompt += `- ✗ ${phrase}\n`;
    }
    prompt += '\n';
  }

  prompt += '## Content to Evaluate\n\n';
  prompt += `${content}\n\n`;

  prompt += '## Task\n\n';
  prompt += 'Evaluate the content above against the brand voice guidelines. Provide:\n';
  prompt += '1. An overall alignment score (0-100)\n';
  prompt += '2. A brief summary of how well it aligns\n';
  prompt += '3. Individual scores for each voice attribute\n';
  prompt += '4. Specific violations (phrases that don\'t match the voice)\n';
  prompt += '5. Strengths (what it does well)\n';
  prompt += '6. Recommendations for improvement\n';

  return prompt;
}
