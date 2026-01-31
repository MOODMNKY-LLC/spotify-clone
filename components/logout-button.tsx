'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch {
      await supabase.auth.signOut({ scope: 'local' })
    }
    router.push('/auth/signout')
    setIsLoggingOut(false)
  }

  return (
    <Button onClick={logout} disabled={isLoggingOut}>
      {isLoggingOut ? 'Logging out…' : 'Logout'}
    </Button>
  )
}
