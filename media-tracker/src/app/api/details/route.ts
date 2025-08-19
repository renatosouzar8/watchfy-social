import { NextResponse } from 'next/server';
import { getMediaDetails } from '@/lib/tmdb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get('id');
  const mediaType = searchParams.get('type') as 'movie' | 'tv' | null;

  if (!mediaId || !mediaType) {
    return NextResponse.json({ error: 'Missing id or type parameters' }, { status: 400 });
  }

  try {
    const details = await getMediaDetails(mediaType, parseInt(mediaId, 10));
    return NextResponse.json(details);
  } catch (error) {
    console.error('[API_DETAILS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch media details' }, { status: 500 });
  }
}
