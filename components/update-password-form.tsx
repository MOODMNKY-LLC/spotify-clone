'use client'

import { cn, AUTH_INPUT_CLASS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UpdatePasswordFormProps extends React.ComponentPropsWithoutRef<'div'> {
  /** When true, render only form content (no card/header) for use inside a single card layout */
  embedded?: boolean
}

export function UpdatePasswordForm({ className, embedded, ...props }: UpdatePasswordFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push('/protected')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = (
    <form onSubmit={handleForgotPassword} noValidate>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="update-password" className="text-neutral-300">New password</Label>
          <Input
            id="update-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <Button
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save new password'}
        </Button>
      </div>
    </form>
  )

  if (embedded) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        {formContent}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="border-neutral-700 bg-neutral-800">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Reset Your Password</CardTitle>
          <CardDescription className="text-neutral-400">Please enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    </div>
  )
}
