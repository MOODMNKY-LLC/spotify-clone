'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/**
 * OAuth callback landing page. Supabase may redirect here with:
 * - ?code=...&next=... on success (we forward to /auth/oauth so the route handler can exchange the code)
 * - #error=...&error_description=... on failure (hash is not sent to server; we parse and redirect to /auth/error)
 * This page ensures production users see the real error message when auth fails (e.g. redirect URL not in Supabase dashboard).
 */
export default function AuthCallbackPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
    const hashParams = new URLSearchParams(hash)

    // Supabase sends OAuth errors in the URL fragment (hash); server never sees it
    const errorFromHash = hashParams.get('error') ?? hashParams.get('error_code')
    const errorDescription = hashParams.get('error_description')
    if (errorFromHash || errorDescription) {
      const q = new URLSearchParams()
      if (errorFromHash) q.set('error', errorFromHash)
      if (hashParams.get('error_code')) q.set('error_code', hashParams.get('error_code')!)
      if (errorDescription) q.set('error_description', errorDescription)
      window.location.replace(`/auth/error?${q.toString()}`)
      return
    }

    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const safeNext = next.startsWith('/') ? next : '/'

    if (code) {
      // Forward to route handler so it can exchange code for session (server-side)
      const oauthUrl = `/auth/oauth?code=${encodeURIComponent(code)}&next=${encodeURIComponent(safeNext)}`
      window.location.replace(oauthUrl)
      return
    }

    // No code and no error in hash: e.g. user opened /auth/callback directly
    window.location.replace('/auth/error?error=No+authorization+code+received')
  }, [searchParams])

  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <p className="text-muted-foreground">Completing sign-in…</p>
    </div>
  )
}
