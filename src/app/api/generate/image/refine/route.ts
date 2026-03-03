import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getModelConfig } from '@/lib/ai/model-router';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    const { image, prompt, channel_id } = body;

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'image and prompt are required' },
        { status: 400 }
      );
    }

    // Build refinement prompt
    let fullPrompt = `## Image Refinement Request\n\n`;
    fullPrompt += `Please refine the provided image based on the following instructions:\n\n`;
    fullPrompt += `${prompt}\n\n`;
    fullPrompt += `## Guidelines\n\n`;
    fullPrompt += `- Maintain the overall composition and style\n`;
    fullPrompt += `- Apply the requested changes precisely\n`;
    fullPrompt += `- Keep the brand aesthetic: clean, minimal, premium, design-forward\n`;
    fullPrompt += `- Brand: Sonance architectural audio systems\n`;

    // Add channel context if provided
    if (channel_id) {
      const { data: channel } = await supabase
        .from('channels')
        .select('name, voice_foundation')
        .eq('id', channel_id)
        .single();

      if (channel && channel.voice_foundation) {
        fullPrompt += `\n**Channel Context:** ${channel.name}\n`;
        fullPrompt += `${channel.voice_foundation}\n`;
      }
    }

    // Use flash model for iterative refinement (faster)
    const modelConfig = getModelConfig('image_edit');
    const model = genAI.getGenerativeModel({ model: modelConfig.model });

    // Prepare image data
    const imageData = image.replace(/^data:image\/\w+;base64,/, '');

    const generateContentRequest: any = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageData,
              },
            },
            { text: fullPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxOutputTokens,
      },
    };

    // Only add responseModalities for models that support it
    if (modelConfig.model.includes('2.5')) {
      generateContentRequest.generationConfig.responseModalities = ['image', 'text'];
    }

    const result = await model.generateContent(generateContentRequest);

    // Extract refined image from response
    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: 'No refined image generated' },
        { status: 500 }
      );
    }

    const imagePart = candidates[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );

    if (!imagePart?.inlineData) {
      return NextResponse.json(
        {
          error: 'Image refinement failed. The model may not support image editing.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/jpeg',
      model: modelConfig.model,
    });
  } catch (error: any) {
    console.error('Error refining image:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to refine image',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
