import { NextRequest, NextResponse } from 'next/server';

const SALSIFY_BASE = 'https://app.salsify.com/api/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = process.env.SALSIFY_TOKEN;
  
  if (!token) {
    return NextResponse.json({ error: 'SALSIFY_TOKEN not configured' }, { status: 500 });
  }

  try {
    const salsifyUrl = `${SALSIFY_BASE}/products/${encodeURIComponent(id)}?access_token=${token}`;

    const response = await fetch(salsifyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Salsify API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Salsify API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching product from Salsify:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
