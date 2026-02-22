import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const SALSIFY_BASE = 'https://app.salsify.com/api/v1';

export async function POST(request: NextRequest) {
  const token = process.env.SALSIFY_TOKEN;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!token) {
    return NextResponse.json({ error: 'SALSIFY_TOKEN not configured' }, { status: 500 });
  }

  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { imageUrl, productId, fieldName, filename, tags = [] } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Download image from Salsify
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download image from Salsify' },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Generate filename if not provided
    const ext = contentType.split('/')[1] || 'jpg';
    const finalFilename = filename || `${productId || Date.now()}.${ext}`;
    const storagePath = `salsify/${finalFilename}`;

    // Create Supabase admin client for storage operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('marketing-assets')
      .upload(storagePath, imageBuffer, {
        contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload to storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('marketing-assets')
      .getPublicUrl(storagePath);

    // Get current user for uploaded_by
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Create asset record
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        name: finalFilename,
        storage_path: storagePath,
        source: 'salsify',
        salsify_id: productId || null,
        salsify_field: fieldName || null,
        tags: tags,
        uploaded_by: user?.id || null
      })
      .select()
      .single();

    if (assetError) {
      console.error('Asset record error:', assetError);
      return NextResponse.json(
        { error: `Failed to create asset record: ${assetError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      asset,
      publicUrl
    });

  } catch (error: any) {
    console.error('Error importing asset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import asset' },
      { status: 500 }
    );
  }
}
