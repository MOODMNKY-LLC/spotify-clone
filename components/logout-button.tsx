'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch {
      await supabase.auth.signOut({ scope: 'local' })
    }
    router.push('/auth/login')
  }

  return <Button onClick={logout}>Logout</Button>
}
