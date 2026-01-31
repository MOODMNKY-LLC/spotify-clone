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
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  /** When provided (e.g. in a modal), called after successful login instead of redirecting */
  onSuccess?: () => void
  /** When true, render only form content (no card/header) for use inside AuthModal */
  embedded?: boolean
  /** When provided (e.g. in auth modal), switch to sign-up view instead of linking to sign-up page */
  onSwitchToSignUp?: () => void
}

export function LoginForm({ className, onSuccess, embedded, onSwitchToSignUp, ...props }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/')
      }
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : err instanceof Error
            ? err.message
            : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setSocialLoading(true)
    setError(null)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
          scopes:
            'user-read-email user-read-private user-library-read user-read-playback-state user-read-currently-playing user-modify-playback-state playlist-read-private playlist-read-collaborative user-top-read user-read-recently-played',
        },
      })
      if (oauthError) throw oauthError
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : err instanceof Error
            ? err.message
            : 'An error occurred'
      setError(message)
      setSocialLoading(false)
    }
  }

  const dividerBg = embedded ? 'bg-neutral-800' : 'bg-card';
  const formContent = (
    <>
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <div className="grid gap-2">
          <Label htmlFor="login-email" className="text-neutral-300">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="login-password" className="text-neutral-300">Password</Label>
            <Link
              href="/auth/forgot-password"
              className="ml-auto inline-block text-sm text-neutral-400 underline-offset-4 hover:text-emerald-400 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
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
          {isLoading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className={cn(dividerBg, 'px-3 text-neutral-500')}>Or continue with</span>
        </div>
      </div>

      <form onSubmit={handleSocialLogin}>
        <Button
          type="submit"
          variant="outline"
          className="w-full border-neutral-600 text-white hover:bg-neutral-700 hover:text-white"
          disabled={socialLoading}
        >
          {socialLoading ? 'Redirecting...' : 'Continue with Spotify'}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-400 pt-1">
        Don&apos;t have an account?{' '}
        {embedded && onSwitchToSignUp ? (
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300"
          >
            Sign up
          </button>
        ) : (
          <Link href="/auth/sign-up" className="font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300">
            Sign up
          </Link>
        )}
      </p>
    </>
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
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-card-foreground">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {formContent}
        </CardContent>
      </Card>
    </div>
  )
}
