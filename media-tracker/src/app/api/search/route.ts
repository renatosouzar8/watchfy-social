import { NextResponse } from 'next/server';
import { searchMedia } from '@/lib/tmdb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const results = await searchMedia(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('[API_SEARCH_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}
