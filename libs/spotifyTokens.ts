/**
 * Server-only helpers for persisting Spotify OAuth tokens in the database.
 * Tokens are stored so Spotify API routes work even when Supabase session refresh nulls provider_token.
 * Do not import in client components.
 */

import { createClient } from '@/lib/supabase/server';

const SPOTIFY_TOKEN_EXPIRY_SECONDS = 3600; // ~1 hour

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
}

/**
 * Save Spotify tokens to DB for the given user. Called after OAuth callback and on token refresh.
 */
export async function saveSpotifyTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt?: Date | null
): Promise<void> {
  const supabase = await createClient();
  const expiresAtIso = expiresAt?.toISOString() ?? new Date(Date.now() + SPOTIFY_TOKEN_EXPIRY_SECONDS * 1000).toISOString();
  await supabase.from('user_spotify_tokens').upsert(
    {
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

/**
 * Get Spotify tokens for the current user. Tries DB first, then session.
 * Returns null if no tokens available.
 */
export async function getSpotifyTokensForCurrentUser(): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const userId = user.id;
  const { data: { session } } = await supabase.auth.getSession();
  const s = session as { provider_token?: string; provider_refresh_token?: string } | null;

  // Try DB first
  const { data: row } = await supabase
    .from('user_spotify_tokens')
    .select('access_token, refresh_token')
    .eq('user_id', userId)
    .single();

  if (row?.access_token && row?.refresh_token) {
    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      userId,
    };
  }

  // Fallback to session
  if (s?.provider_token && s?.provider_refresh_token) {
    return {
      accessToken: s.provider_token,
      refreshToken: s.provider_refresh_token,
      userId,
    };
  }

  return null;
}

/**
 * Check if the current user has Spotify linked (tokens in DB or session).
 */
export async function isSpotifyLinkedForCurrentUser(): Promise<boolean> {
  const tokens = await getSpotifyTokensForCurrentUser();
  return tokens !== null;
}
