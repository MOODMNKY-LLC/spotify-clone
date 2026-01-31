import { getSiteOrigin } from '@/lib/metadata'
import { supabaseAdmin } from '@/libs/supabaseAdmin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { Database } from '@/types_db'

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-key'

/**
 * OAuth callback route. Supabase redirects here with ?code=...&state=...&next=/
 *
 * Required order (await is critical):
 * 1. await exchangeCodeForSession(code) — session (including provider_token) is received
 *    and Supabase calls setAll() to write session cookies onto redirectRes.
 * 2. Read provider_token / provider_refresh_token from the returned session immediately.
 * 3. await token upsert to DB — persist tokens before sending the redirect.
 * 4. return redirectRes — client must not land on home before DB has the row, or
 *    /api/spotify/user/* will 401 (no tokens yet).
 *
 * We run the exchange on this FIRST request (same request that has the flow-state
 * cookies), which fixes flow_state_not_found that occurred when we did a client
 * redirect to /auth/oauth and exchanged on the second request.
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
                path: '/' as const,
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
      // Capture tokens immediately after exchange so we never persist before they're received.
      const accessToken = s?.provider_token
      const refreshToken = s?.provider_refresh_token
      const userId = data.session.user?.id
      if (!accessToken || !refreshToken) {
        console.warn(
          '[auth/callback] Session has no provider_token/provider_refresh_token. ' +
            'Supabase may not be returning Spotify tokens; check Supabase Dashboard → Auth → Providers → Spotify is enabled and returning tokens.'
        )
      }
      if (accessToken && refreshToken && userId) {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
        const isProd = process.env.NODE_ENV === 'production'
        const cannotSaveInProd =
          isProd && (!serviceRoleKey || serviceRoleKey === 'placeholder-service-role-key')

        if (cannotSaveInProd) {
          console.error(
            '[auth/callback] SUPABASE_SERVICE_ROLE_KEY is missing or placeholder in production. ' +
              'Spotify tokens cannot be saved; set it in your production env (e.g. Vercel) so "From Spotify" works.'
          )
          const errorSearch = new URLSearchParams()
          errorSearch.set('error_code', 'spotify_tokens_not_saved')
          errorSearch.set(
            'error',
            'Spotify was connected but this server could not save your session. "From Spotify" will stay empty until the server is configured.'
          )
          return NextResponse.redirect(`${base}/auth/error?${errorSearch.toString()}`)
        }

        // Persist tokens before sending redirect (client must not land on home before DB has row).
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
        const { error: upsertError } = await supabaseAdmin.from('user_spotify_tokens').upsert(
          {
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        if (upsertError) {
          console.error(
            '[auth/callback] Failed to save Spotify tokens:',
            upsertError.message,
            (upsertError as { code?: string }).code ?? '',
            '- Check: table user_spotify_tokens exists in this Supabase project; NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are from the same project.'
          )
          const errorSearch = new URLSearchParams()
          errorSearch.set('error_code', 'spotify_tokens_not_saved')
          errorSearch.set(
            'error',
            'Spotify was connected but saving your session failed. Try again or check server logs.'
          )
          return NextResponse.redirect(`${base}/auth/error?${errorSearch.toString()}`)
        } else {
          console.info('[auth/callback] Spotify tokens saved successfully for user.')
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
