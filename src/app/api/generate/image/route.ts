import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getModelConfig } from '@/lib/ai/model-router';
import { logAiUsage, estimateTokenCount } from '@/lib/ai/usage-logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const STYLE_PRESETS: Record<string, string> = {
  'photo-realistic': 'Ultra-realistic photography, professional lighting, sharp focus, natural colors, high-fidelity product shot',
  'lifestyle': 'Lifestyle photography, natural setting, aspirational mood, soft natural lighting, people interacting with product in authentic environments',
  'product-hero': 'Hero product shot, dramatic lighting, premium aesthetic, minimalist composition, product as focal point on clean background',
  'abstract-mood': 'Abstract composition, mood-focused, artistic interpretation, creative angles, emphasis on emotion and atmosphere over literal product representation',
};

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      channel_id,
      scene_name,
      product_id,
      style_preset,
      prompt,
      quality = 'draft',
      reference_image,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Build the complete prompt
    let fullPrompt = '';

    // Add channel context if provided
    if (channel_id) {
      const { data: channel } = await supabase
        .from('channels')
        .select('name, visual_scenes')
        .eq('id', channel_id)
        .single();

      if (channel) {
        fullPrompt += `## Brand Channel: ${channel.name}\n\n`;

        // Add selected scene if provided
        if (scene_name && channel.visual_scenes) {
          const scene = (channel.visual_scenes as any[]).find(
            (s: any) => s.name === scene_name
          );

          if (scene) {
            fullPrompt += `## Visual Scene: ${scene.name}\n\n`;
            fullPrompt += `**Looks Like:**\n${scene.looks_like}\n\n`;
            if (scene.excludes) {
              fullPrompt += `**Avoid:**\n${scene.excludes}\n\n`;
            }
          }
        }
      }
    }

    // Add product context if provided
    if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('product_model, description_long, category, brand')
        .eq('id', product_id)
        .single();

      if (product) {
        fullPrompt += `## Product Context\n\n`;
        fullPrompt += `**Product:** ${product.product_model}\n`;
        fullPrompt += `**Brand:** ${product.brand}\n`;
        fullPrompt += `**Category:** ${product.category}\n`;
        if (product.description_long) {
          fullPrompt += `\n${product.description_long}\n`;
        }
        fullPrompt += '\n';
      }
    }

    // Add style preset if provided
    if (style_preset && STYLE_PRESETS[style_preset]) {
      fullPrompt += `## Style Direction\n\n${STYLE_PRESETS[style_preset]}\n\n`;
    }

    // Add user prompt
    fullPrompt += `## Instructions\n\n${prompt}\n\n`;

    // Add global constraints
    fullPrompt += `## Constraints\n\n`;
    fullPrompt += `- Brand: Sonance architectural audio systems\n`;
    fullPrompt += `- Aesthetic: Clean, minimal, design-forward, premium\n`;
    fullPrompt += `- Focus: Elegant integration, architectural beauty, sophisticated lifestyle\n`;
    fullPrompt += `- Avoid: Cluttered compositions, aggressive marketing, cheap aesthetics\n`;

    // Select model based on quality
    const taskType = quality === 'hero' ? 'image_hero' : 'image_draft';
    const modelConfig = getModelConfig(taskType);

    // Generate image
    const model = genAI.getGenerativeModel({ model: modelConfig.model });

    const generateContentRequest: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxOutputTokens,
      },
    };

    // Only add responseModalities for models that support it (2.5 Pro)
    if (modelConfig.tier === 'image' && modelConfig.model.includes('2.5')) {
      generateContentRequest.generationConfig.responseModalities = ['image', 'text'];
    }

    const startTime = Date.now();
    const result = await model.generateContent(generateContentRequest);
    const durationMs = Date.now() - startTime;

    // Extract image from response
    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    // Look for inline data (image)
    const imagePart = candidates[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );

    if (!imagePart?.inlineData) {
      // Model might not support image generation - return error with explanation
      return NextResponse.json(
        {
          error: 'Image generation failed. The selected model may not support image output.',
          details: 'Try using quality="hero" or check model configuration.',
        },
        { status: 500 }
      );
    }

    // Log AI usage
    const inputTokens = estimateTokenCount(fullPrompt);
    // Image output tokens are typically small (just metadata/description)
    const outputTokens = 100; // Approximate for image generation
    
    logAiUsage({
      userId: user.id,
      taskType: taskType,
      model: modelConfig.model,
      tier: modelConfig.tier,
      inputTokens,
      outputTokens,
      durationMs,
    }).catch(err => console.error('Failed to log AI usage:', err));

    // Return base64 image
    return NextResponse.json({
      success: true,
      image: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/jpeg',
      prompt_used: fullPrompt,
      model: modelConfig.model,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate image',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
