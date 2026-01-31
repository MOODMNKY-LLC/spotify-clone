'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthModal } from '@/hooks/useAuthModal'

/**
 * Sign-up is shown as a modal from the header. This page redirects to home
 * and opens the sign-up modal so direct links to /auth/sign-up still work.
 */
export default function Page() {
  const router = useRouter()
  const onOpen = useAuthModal((s) => s.onOpen)

  useEffect(() => {
    onOpen('sign-up')
    router.replace('/')
  }, [onOpen, router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">Redirecting…</p>
    </div>
  )
}
