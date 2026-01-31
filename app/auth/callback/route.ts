import { getSiteOrigin } from '@/lib/metadata'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { Database } from '@/types_db'

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-key'

/**
 * OAuth callback route. Supabase redirects here with ?code=...&state=...&next=/
 * We run exchangeCodeForSession on this FIRST request (same request that has the
 * flow-state cookies), which fixes flow_state_not_found that occurred when we
 * did a client redirect to /auth/oauth and exchanged on the second request.
 * Session cookies are written onto the redirect response so the client receives
 * the session (including provider_token) on the next page load.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestOrigin = new URL(request.url).origin
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) next = '/'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const base =
    getSiteOrigin() ??
    (forwardedHost ? `https://${forwardedHost}` : requestOrigin)

  if (code) {
    const cookieStore = await cookies()
    const redirectRes = NextResponse.redirect(`${base}${next}`)
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || PLACEHOLDER_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        PLACEHOLDER_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: unknown }[]) {
            const isSecure = base.startsWith('https')
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = {
                ...(typeof options === 'object' && options !== null ? (options as Record<string, unknown>) : {}),
                sameSite: 'lax' as const,
                ...(isSecure && { secure: true }),
              }
              redirectRes.cookies.set(name, value, opts as Parameters<typeof redirectRes.cookies.set>[2])
            })
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.session) {
      const s = data.session as { provider_token?: string; provider_refresh_token?: string }
      if (s?.provider_token && s?.provider_refresh_token && data.session.user?.id) {
        // Use the same supabase instance (has session) so RLS allows the insert.
        // saveSpotifyTokens() creates a new client that reads request cookies; those
        // don't have the new session yet (we only set it on redirectRes), so RLS would block.
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
        const { error: upsertError } = await supabase.from('user_spotify_tokens').upsert(
          {
            user_id: data.session.user.id,
            access_token: s.provider_token,
            refresh_token: s.provider_refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        if (upsertError) {
          console.error('[auth/callback] Failed to save Spotify tokens:', upsertError.message)
        }
      }
      return redirectRes
    }
    if (error) {
      const errorSearch = new URLSearchParams()
      errorSearch.set('error', error.message)
      if ('code' in error && typeof (error as { code?: string }).code === 'string') {
        errorSearch.set('error_code', (error as { code: string }).code)
      }
      return NextResponse.redirect(`${base}/auth/error?${errorSearch.toString()}`)
    }
  }

  // No code: return HTML that parses hash and redirects (for OAuth errors in fragment)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Completing sign-in…</title></head><body><p>Completing sign-in…</p><script>
(function(){
  var hash = (window.location.hash || '').slice(1);
  var params = new URLSearchParams(hash);
  var err = params.get('error') || params.get('error_code');
  var desc = params.get('error_description');
  if (err || desc) {
    var q = new URLSearchParams();
    if (err) q.set('error', err);
    if (params.get('error_code')) q.set('error_code', params.get('error_code'));
    if (desc) q.set('error_description', desc);
    window.location.replace('/auth/error?' + q.toString());
    return;
  }
  window.location.replace('/auth/error?error=No+authorization+code+received');
})();
</script></body></html>`
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
