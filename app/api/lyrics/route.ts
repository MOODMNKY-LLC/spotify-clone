import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lyrics?artist=...&title=...
 * Fetches lyrics from lyrics.ovh (no API key). Returns { lyrics: string } or 404.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist')?.trim();
  const title = searchParams.get('title')?.trim();

  if (!artist || !title) {
    return NextResponse.json(
      { error: 'Missing artist or title' },
      { status: 400 }
    );
  }

  const encodedArtist = encodeURIComponent(artist);
  const encodedTitle = encodeURIComponent(title);
  const url = `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.status === 404) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || 'Lyrics provider error' },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const data = (await res.json()) as { lyrics?: string };
    const lyrics = typeof data?.lyrics === 'string' ? data.lyrics : null;

    if (!lyrics) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    return NextResponse.json({ lyrics });
  } catch (e) {
    console.warn('[lyrics] fetch failed:', (e as Error)?.message);
    return NextResponse.json(
      { error: 'Failed to fetch lyrics' },
      { status: 502 }
    );
  }
}
