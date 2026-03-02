import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getModelConfig } from '@/lib/ai/model-router';
import type { Channel, BrandVoice } from '@/lib/ai/prompt-builder';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    // Fetch session details
    const { data: session, error: sessionError } = await supabase
      .from('workshop_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check ownership (allow admins)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';
    
    if (session.owner_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Save user message
    const { error: userMessageError } = await supabase
      .from('workshop_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
    }

    // Fetch channel context if set
    let channel: Channel | undefined;
    if (session.channel_id) {
      const { data: channelData } = await supabase
        .from('channels')
        .select('*')
        .eq('id', session.channel_id)
        .maybeSingle();

      if (channelData) {
        channel = channelData as Channel;
      }
    }

    // Fetch global brand voice
    const { data: brandVoice } = await supabase
      .from('brand_voice')
      .select('*')
      .eq('key', 'sonance-master')
      .maybeSingle();

    // Fetch conversation history
    const { data: messageHistory } = await supabase
      .from('workshop_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Build system prompt for creative partner
    const systemPrompt = buildCreativePartnerPrompt(
      channel,
      brandVoice as BrandVoice | undefined
    );

    // Get model configuration for creative_chat
    const modelConfig = getModelConfig('creative_chat');

    // Initialize Gemini
    const model = genAI.getGenerativeModel({
      model: modelConfig.model,
      generationConfig: {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxOutputTokens,
      },
    });

    // Build chat history for context
    const chatHistory = (messageHistory || [])
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // Don't include the current message
      systemInstruction: systemPrompt,
    });

    // Generate streaming response
    const result = await chat.sendMessageStream(message);

    // Create readable stream for response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
          controller.close();

          // Save assistant message after stream completes
          await supabase
            .from('workshop_messages')
            .insert({
              session_id: sessionId,
              role: 'assistant',
              content: fullResponse,
            });

          // Update session updated_at
          await supabase
            .from('workshop_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);

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
    console.error('Workshop chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

function buildCreativePartnerPrompt(
  channel?: Channel,
  brandVoice?: BrandVoice
): string {
  let prompt = '# Creative Partner for Sonance Marketing\n\n';
  prompt += 'You are an enthusiastic and insightful creative partner helping to brainstorm and develop marketing content for Sonance, a luxury audio brand.\n\n';

  prompt += '## Your Role\n\n';
  prompt += '- **Brainstorming Partner**: Help generate ideas, explore angles, and develop concepts\n';
  prompt += '- **Encouraging**: Be positive and constructive, building on ideas rather than shutting them down\n';
  prompt += '- **Brand Guardian**: Ensure ideas align with Sonance brand voice and positioning\n';
  prompt += '- **Strategic Thinker**: Consider audience, platform, and objectives\n';
  prompt += '- **Practical**: Offer actionable suggestions and specific examples\n\n';

  // Brand voice context
  if (brandVoice) {
    prompt += '## Sonance Brand Voice\n\n';
    if (brandVoice.voice_foundation) {
      prompt += `${brandVoice.voice_foundation}\n\n`;
    }
    if (brandVoice.voice_attributes?.length > 0) {
      prompt += '### Core Voice Attributes:\n';
      for (const attr of brandVoice.voice_attributes) {
        prompt += `- **${attr.name}**: ${attr.description}\n`;
      }
      prompt += '\n';
    }
    if (brandVoice.we_say?.length > 0) {
      prompt += '### Language We Use:\n';
      for (const phrase of brandVoice.we_say) {
        prompt += `- ✓ ${phrase}\n`;
      }
      prompt += '\n';
    }
    if (brandVoice.we_dont_say?.length > 0) {
      prompt += '### Language We Avoid:\n';
      for (const phrase of brandVoice.we_dont_say) {
        prompt += `- ✗ ${phrase}\n`;
      }
      prompt += '\n';
    }
  }

  // Channel context
  if (channel) {
    prompt += `## Channel Context: ${channel.name}\n\n`;
    if (channel.description) {
      prompt += `${channel.description}\n\n`;
    }
    if (channel.voice_foundation) {
      prompt += `**Channel Voice**: ${channel.voice_foundation}\n\n`;
    }
    if (channel.voice_attributes?.length > 0) {
      prompt += '### Channel Voice Attributes:\n';
      for (const attr of channel.voice_attributes) {
        prompt += `- **${attr.name}**: ${attr.description}\n`;
      }
      prompt += '\n';
    }
  }

  prompt += '## Guidelines\n\n';
  prompt += '- Ask clarifying questions when needed\n';
  prompt += '- Offer multiple options when brainstorming\n';
  prompt += '- Reference specific brand voice attributes in your suggestions\n';
  prompt += '- Be conversational but professional\n';
  prompt += '- Help refine rough ideas into polished concepts\n';
  prompt += '- Suggest specific words, phrases, or approaches\n';
  prompt += '- Consider the target audience and their mindset\n\n';

  prompt += 'Ready to create something amazing!';

  return prompt;
}

// GET - Fetch chat history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch session to verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('workshop_sessions')
      .select('owner_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check ownership (allow admins)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';
    
    if (session.owner_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('workshop_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages });

  } catch (error: any) {
    console.error('Chat history fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
