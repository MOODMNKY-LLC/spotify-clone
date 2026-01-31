import { NextResponse } from 'next/server';
import { search, getArtist } from '@/libs/spotify';
import { search2, isNavidromeConfigured } from '@/libs/navidrome';
import { searchArtists } from '@/libs/musicbrainz';

export const dynamic = 'force-dynamic';

export interface ArtistInfoResponse {
  name: string;
  image?: string | null;
  url?: string | null;
  /** Navidrome artist id for /artist/[id] link */
  artistId?: string | null;
  /** MusicBrainz disambiguation or short blurb */
  disambiguation?: string | null;
}

/**
 * GET /api/artist-info?artist=...&source=spotify|navidrome|supabase
 * Returns artist name, image, url (or artistId for Navidrome) for the About the artist card.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get('artist')?.trim();
  const source = searchParams.get('source') as 'spotify' | 'navidrome' | 'supabase' | null;

  if (!artistName) {
    return NextResponse.json({ error: 'Missing artist' }, { status: 400 });
  }

  if (source === 'spotify') {
    const data = await search(artistName, 'artist', 1);
    const items = data?.artists?.items as { id?: string; name?: string; images?: { url: string }[]; external_urls?: { spotify?: string } }[] | undefined;
    const first = Array.isArray(items) ? items[0] : null;
    if (!first?.id) {
      return NextResponse.json({ name: artistName } as ArtistInfoResponse);
    }
    const full = await getArtist(first.id);
    const image = full?.images?.sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0]?.url ?? first.images?.[0]?.url;
    return NextResponse.json({
      name: full?.name ?? first.name ?? artistName,
      image: image ?? null,
      url: full?.external_urls?.spotify ?? first.external_urls?.spotify ?? null,
    } as ArtistInfoResponse);
  }

  if (source === 'navidrome' && isNavidromeConfigured()) {
    const data = await search2(artistName);
    const sub = data as { searchResult2?: { artist?: { id: string; name?: string }[] } };
    const artists = sub?.searchResult2?.artist;
    const first = Array.isArray(artists) ? artists[0] : null;
    if (!first?.id) {
      return NextResponse.json({ name: artistName } as ArtistInfoResponse);
    }
    return NextResponse.json({
      name: first.name ?? artistName,
      artistId: first.id,
      url: null,
      image: null,
    } as ArtistInfoResponse);
  }

  if (source === 'supabase' || !source) {
    try {
      const artists = await searchArtists(artistName, 1);
      const first = artists[0];
      if (!first) {
        return NextResponse.json({ name: artistName } as ArtistInfoResponse);
      }
      return NextResponse.json({
        name: first.name ?? artistName,
        disambiguation: first.disambiguation ?? null,
        image: null,
        url: null,
      } as ArtistInfoResponse);
    } catch {
      return NextResponse.json({ name: artistName } as ArtistInfoResponse);
    }
  }

  return NextResponse.json({ name: artistName } as ArtistInfoResponse);
}
