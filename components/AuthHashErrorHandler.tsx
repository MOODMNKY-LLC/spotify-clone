'use client'

import { useEffect } from 'react'

/**
 * When Supabase redirects to Site URL (e.g. https://muzik.moodmnky.com) with
 * OAuth error in the hash (#error=...&error_description=...), the server never
 * sees it. This component runs on the client and redirects to /auth/error with
 * those params so the user sees the real error instead of the home page.
 */
export function AuthHashErrorHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const params = new URLSearchParams(hash)
    const error = params.get('error') ?? params.get('error_code')
    const errorDescription = params.get('error_description')
    const errorCode = params.get('error_code')
    if (!error && !errorDescription) return
    const q = new URLSearchParams()
    if (error) q.set('error', error)
    if (errorCode) q.set('error_code', errorCode)
    if (errorDescription) q.set('error_description', errorDescription)
    window.location.replace(`/auth/error?${q.toString()}`)
  }, [])
  return null
}
