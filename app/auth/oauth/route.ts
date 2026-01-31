import { getSiteOrigin } from '@/lib/metadata'
import { createClient } from '@/lib/supabase/server'
import { saveSpotifyTokens } from '@/libs/spotifyTokens'
import { NextResponse } from 'next/server'

/**
 * OAuth callback: exchanges the auth code for a session (PKCE).
 * The code verifier must be available in the same browser (client stores it when
 * signInWithOAuth runs). Server createClient() reads cookies so the session
 * (including provider_token for Spotify) is set on the response.
 * Persists Spotify tokens to user_spotify_tokens so API routes work after Supabase session refresh.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestOrigin = new URL(request.url).origin
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const errorCode = searchParams.get('error_code')
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) next = '/'

  // Prefer canonical site URL in production so redirects are correct behind proxies
  const forwardedHost = request.headers.get('x-forwarded-host')
  const base =
    getSiteOrigin() ??
    (forwardedHost ? `https://${forwardedHost}` : requestOrigin)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.session) {
      const s = data.session as { provider_token?: string; provider_refresh_token?: string }
      if (s?.provider_token && s?.provider_refresh_token && data.session.user?.id) {
        try {
          await saveSpotifyTokens(
            data.session.user.id,
            s.provider_token,
            s.provider_refresh_token
          )
        } catch {
          // Non-fatal; session still has tokens for immediate use
        }
      }
      return NextResponse.redirect(`${base}${next}`)
    }
  }

  const errorSearch = new URLSearchParams()
  if (errorParam) errorSearch.set('error', errorParam)
  if (errorCode) errorSearch.set('error_code', errorCode)
  if (errorDescription) errorSearch.set('error_description', errorDescription)
  const query = errorSearch.toString()
  return NextResponse.redirect(`${base}/auth/error${query ? `?${query}` : ''}`)
}
