import { NextRequest, NextResponse } from 'next/server';

const SALSIFY_BASE = 'https://app.salsify.com/api/v1';

export async function GET(request: NextRequest) {
  const token = process.env.SALSIFY_TOKEN;
  
  if (!token) {
    return NextResponse.json({ error: 'SALSIFY_TOKEN not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '20');
  const filter = searchParams.get('filter') || '';

  try {
    // Build Salsify API URL
    const salsifyUrl = new URL(`${SALSIFY_BASE}/products`);
    salsifyUrl.searchParams.set('access_token', token);
    salsifyUrl.searchParams.set('page', page.toString());
    salsifyUrl.searchParams.set('per_page', perPage.toString());
    
    if (search) {
      salsifyUrl.searchParams.set('filter', `search:${search}`);
    } else if (filter) {
      salsifyUrl.searchParams.set('filter', filter);
    }

    const response = await fetch(salsifyUrl.toString(), {
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
    console.error('Error fetching from Salsify:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
