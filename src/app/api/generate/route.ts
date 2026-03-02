import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/ai/prompt-builder';
import { getModelConfig, getDefaultModelConfig, type TaskType } from '@/lib/ai/model-router';
import type { 
  Channel, 
  Platform, 
  ContentType, 
  Product,
  BrandVoice,
  ChannelPlatformGuideline
} from '@/lib/ai/prompt-builder';
import type { DontSayRule } from '@/lib/ai/guardrails';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

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
    const { 
      channel_id, 
      platform_id, 
      content_type_id, 
      product_id, 
      brief,
      task_type 
    } = body;

    if (!channel_id || !platform_id || !content_type_id || !brief) {
      return NextResponse.json(
        { error: 'Missing required fields: channel_id, platform_id, content_type_id, brief' },
        { status: 400 }
      );
    }

    // Fetch channel details
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channel_id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Fetch platform details (including constraints)
    const { data: platform, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', platform_id)
      .single();

    if (platformError || !platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    // Fetch content type
    const { data: contentType, error: contentTypeError } = await supabase
      .from('content_types')
      .select('*')
      .eq('id', content_type_id)
      .single();

    if (contentTypeError || !contentType) {
      return NextResponse.json({ error: 'Content type not found' }, { status: 404 });
    }

    // Fetch global brand voice
    const { data: brandVoice, error: brandVoiceError } = await supabase
      .from('brand_voice')
      .select('*')
      .eq('key', 'sonance-master')
      .single();

    if (brandVoiceError) {
      console.warn('No global brand voice found, continuing without it');
    }

    // Fetch channel-platform guidelines
    const { data: platformGuideline, error: guidelineError } = await supabase
      .from('channel_platform_guidelines')
      .select('*')
      .eq('channel_id', channel_id)
      .eq('platform_id', platform_id)
      .maybeSingle();

    if (guidelineError) {
      console.warn('Error fetching channel-platform guidelines:', guidelineError);
    }

    // Fetch all active global_dont_say rules (FIXED table name)
    const { data: globalDontSay, error: rulesError } = await supabase
      .from('global_dont_say')
      .select('*')
      .eq('active', true);

    if (rulesError) {
      console.error('Error fetching global_dont_say:', rulesError);
      return NextResponse.json({ error: 'Failed to fetch guardrails' }, { status: 500 });
    }

    // Fetch product if provided
    let product: Product | undefined;
    if (product_id) {
      // Try Salsify proxy first
      try {
        const productRes = await fetch(
          `${request.nextUrl.origin}/api/salsify/products/${product_id}`,
          { headers: { cookie: request.headers.get('cookie') || '' } }
        );
        
        if (productRes.ok) {
          const productData = await productRes.json();
          product = {
            id: productData.id,
            name: productData['salsify:name'] || productData.name || 'Unknown Product',
            description: productData['salsify:description'] || productData.description,
            specs: productData,
            category: productData['salsify:category'] || productData.category,
          };
        }
      } catch (err) {
        console.error('Error fetching product from Salsify:', err);
      }

      // Fallback to Supabase cache if needed
      if (!product) {
        const { data: cachedProduct } = await supabase
          .from('products')
          .select('*')
          .eq('id', product_id)
          .single();

        if (cachedProduct) {
          product = {
            id: cachedProduct.id,
            name: cachedProduct.name || 'Unknown Product',
            description: cachedProduct.description,
            specs: cachedProduct,
          };
        }
      }
    }

    // Build the system prompt with ALL voice data
    const systemPrompt = buildSystemPrompt({
      channel: channel as Channel,
      platform: platform as Platform,
      contentType: contentType as ContentType,
      dontSayRules: (globalDontSay || []) as DontSayRule[],
      brandVoice: brandVoice as BrandVoice | undefined,
      platformGuideline: platformGuideline as ChannelPlatformGuideline | undefined,
      product,
      brief,
    });

    // Get model configuration based on task type
    const modelConfig = task_type 
      ? getModelConfig(task_type as TaskType)
      : getDefaultModelConfig();

    // Initialize Gemini model with routing
    const model = genAI.getGenerativeModel({ 
      model: modelConfig.model,
      generationConfig: {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxOutputTokens,
      }
    });

    // Generate content with streaming
    const result = await model.generateContentStream(systemPrompt);

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
