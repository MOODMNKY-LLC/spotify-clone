import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface YouTubeSearchItem {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle?: string;
  duration?: string;
}

/**
 * GET /api/youtube/search?artist=...&title=... or ?q=...
 * Calls YouTube Data API v3 search list. Requires YOUTUBE_API_KEY.
 * Returns { videos: YouTubeSearchItem[] } or 400/502.
 */
export async function GET(request: Request) {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: 'YouTube API not configured' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const artist = searchParams.get('artist')?.trim();
  const title = searchParams.get('title')?.trim();

  const query = q ?? (artist && title ? `${artist} ${title}` : null);
  if (!query) {
    return NextResponse.json(
      { error: 'Missing q or artist+title' },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '8',
    q: query,
    key,
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || 'YouTube API error' },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const data = (await res.json()) as {
      items?: {
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          thumbnails?: { default?: { url?: string }; medium?: { url?: string }; high?: { url?: string } };
          channelTitle?: string;
        };
      }[];
    };

    const items = data?.items ?? [];
    const videos: YouTubeSearchItem[] = items
      .filter((item) => item?.id?.videoId)
      .map((item) => {
        const sn = item.snippet ?? {};
        const thumbs = sn.thumbnails ?? {};
        const thumb =
          thumbs.medium?.url ?? thumbs.high?.url ?? thumbs.default?.url ?? '';
        return {
          id: item.id!.videoId!,
          title: sn.title ?? '',
          thumbnail: thumb,
          channelTitle: sn.channelTitle,
        };
      });

    return NextResponse.json({ videos });
  } catch (e) {
    console.warn('[youtube/search] fetch failed:', (e as Error)?.message);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 502 }
    );
  }
}
