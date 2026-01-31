import { NextResponse } from 'next/server';
import {
  getRecommendations,
  getTopArtists,
  getRecentlyPlayed,
  refreshSpotifyToken,
} from '@/libs/spotifyWithToken';
import { getSpotifyTokensForCurrentUserWithReason, saveSpotifyTokens } from '@/libs/spotifyTokens';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const result = await getSpotifyTokensForCurrentUserWithReason();
  if (!result.ok) {
    if (result.reason === 'no_tokens') {
      console.warn(
        '[api/spotify/user/recommendations] Session exists but no Spotify tokens (DB or session). ' +
          'In production, ensure SUPABASE_SERVICE_ROLE_KEY is set so the OAuth callback can save tokens.'
      );
    }
    return NextResponse.json(
      {
        error: 'Sign in with Spotify for recommendations',
        code: result.reason === 'no_user' ? 'NO_SESSION' : 'NO_SPOTIFY_TOKENS',
      },
      { status: 401 }
    );
  }
  const tokens = { accessToken: result.accessToken, refreshToken: result.refreshToken, userId: result.userId };

  const tryWithToken = async (token: string) => {
    let seedArtists = '';
    let seedTracks = '';
    const top = await getTopArtists(token, 2);
    if (top?.items?.length) {
      seedArtists = top.items.slice(0, 2).map((a) => a.id).join(',');
    }
    const recent = await getRecentlyPlayed(token, 5);
    if (recent?.items?.length) {
      seedTracks = recent.items
        .slice(0, 3)
        .map((i) => i.track?.id)
        .filter(Boolean)
        .join(',');
    }
    const params: { seed_artists?: string; seed_tracks?: string; seed_genres?: string; limit: number } = {
      limit: Math.min(parseInt(new URL(request.url).searchParams.get('limit') ?? '20', 10) || 20, 50),
    };
    if (seedArtists) params.seed_artists = seedArtists;
    if (seedTracks) params.seed_tracks = seedTracks;
    if (!seedArtists && !seedTracks) params.seed_genres = 'pop,rock';
    return getRecommendations(token, params);
  };

  let data = await tryWithToken(tokens.accessToken);
  if (data === null) {
    const newToken = await refreshSpotifyToken(tokens.refreshToken);
    if (newToken) {
      await saveSpotifyTokens(tokens.userId, newToken, tokens.refreshToken);
      data = await tryWithToken(newToken);
    }
  }
  if (data === null) {
    return NextResponse.json(
      { error: 'Failed to fetch Spotify recommendations' },
      { status: 401 }
    );
  }

  return NextResponse.json(data);
}
