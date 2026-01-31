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
import Link from 'next/link'
import { useState } from 'react'

interface ForgotPasswordFormProps extends React.ComponentPropsWithoutRef<'div'> {
  /** When true, render only form content (no card/header) for use inside a single card layout */
  embedded?: boolean
}

export function ForgotPasswordForm({ className, embedded, ...props }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formContent = success ? (
    <p className="text-sm text-neutral-400">
      If you registered using your email and password, you will receive a password reset email.
    </p>
  ) : (
    <form onSubmit={handleForgotPassword} noValidate>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="forgot-email" className="text-neutral-300">Email</Label>
          <Input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <Button
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send reset email'}
        </Button>
      </div>
      <div className="mt-4 text-center text-sm text-neutral-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-emerald-400 hover:text-emerald-300">
          Log in
        </Link>
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
      {success ? (
        <Card className="border-neutral-700 bg-neutral-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Check Your Email</CardTitle>
            <CardDescription className="text-neutral-400">Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent>{formContent}</CardContent>
        </Card>
      ) : (
        <Card className="border-neutral-700 bg-neutral-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Reset Your Password</CardTitle>
            <CardDescription className="text-neutral-400">
              Type in your email and we&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>{formContent}</CardContent>
        </Card>
      )}
    </div>
  )
}
