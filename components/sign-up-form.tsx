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

interface SignUpFormProps extends React.ComponentPropsWithoutRef<'div'> {
  /** When true, render only form content (no card/header) for use inside AuthModal */
  embedded?: boolean
  /** When provided (e.g. in auth modal), switch to login view instead of linking to login page */
  onSwitchToLogin?: () => void
}

const SPOTIFY_SCOPES =
  'user-read-email user-read-private user-library-read user-read-playback-state user-read-currently-playing user-modify-playback-state playlist-read-private playlist-read-collaborative user-top-read user-read-recently-played'

export function SignUpForm({ className, embedded, onSwitchToLogin, ...props }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const router = useRouter()

  const handleSpotifySignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setSocialLoading(true)
    setError(null)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
          scopes: SPOTIFY_SCOPES,
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
    } finally {
      setSocialLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : error instanceof Error
            ? error.message
            : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const loginLink = (
    <div className="mt-4 text-center text-sm text-neutral-400">
      Already have an account?{' '}
      {embedded && onSwitchToLogin ? (
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300"
        >
          Log in
        </button>
      ) : (
        <Link href="/auth/login" className="font-medium text-emerald-400 underline-offset-4 hover:text-emerald-300">
          Log in
        </Link>
      )}
    </div>
  )

  const dividerBg = embedded ? 'bg-neutral-800' : 'bg-card'
  const formContent = (
    <>
      <form onSubmit={handleSignUp} noValidate>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="signup-email" className="text-neutral-300">Email</Label>
            <Input
              id="signup-email"
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
          <div className="grid gap-2">
            <Label htmlFor="signup-password" className="text-neutral-300">Password</Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={AUTH_INPUT_CLASS}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signup-repeat-password" className="text-neutral-300">Confirm password</Label>
            <Input
              id="signup-repeat-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className={AUTH_INPUT_CLASS}
            />
          </div>
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </div>
      </form>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className={cn(dividerBg, 'px-3 text-neutral-500')}>Or continue with</span>
        </div>
      </div>

      <form onSubmit={handleSpotifySignUp}>
        <Button
          type="submit"
          variant="outline"
          className="w-full border-neutral-600 text-white hover:bg-neutral-700 hover:text-white"
          disabled={socialLoading}
        >
          {socialLoading ? 'Redirecting...' : 'Continue with Spotify'}
        </Button>
      </form>

      <div className="pt-1">
        {loginLink}
      </div>
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
          <CardTitle className="text-2xl text-card-foreground">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    </div>
  )
}
