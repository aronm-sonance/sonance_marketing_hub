import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { generateUploadPath } from '@/lib/supabase/storage';

export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string || file?.name;
    const tagsRaw = formData.get('tags') as string;
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: jpg, png, gif, webp, svg, pdf' },
        { status: 400 }
      );
    }

    // Generate storage path
    const storagePath = generateUploadPath(file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create Supabase admin client for storage operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('marketing-assets')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Create asset record
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        name: name || file.name,
        storage_path: storagePath,
        source: 'upload',
        tags,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (assetError) {
      console.error('Asset record error:', assetError);
      // Try to clean up uploaded file
      await supabaseAdmin.storage
        .from('marketing-assets')
        .remove([storagePath]);

      return NextResponse.json(
        { error: `Failed to create asset record: ${assetError.message}` },
        { status: 500 }
      );
    }

    // Get signed URL for the uploaded file
    const { data: urlData } = await supabaseAdmin.storage
      .from('marketing-assets')
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      success: true,
      asset,
      url: urlData?.signedUrl,
    });
  } catch (error: any) {
    console.error('Error in POST /api/assets/upload:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
