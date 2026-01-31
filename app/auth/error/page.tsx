import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type ErrorSearchParams = {
  error?: string
  error_code?: string
  error_description?: string
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ErrorSearchParams>
}) {
  const params = await searchParams
  const description = params?.error_description ?? params?.error
  const code = params?.error_code

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {description ? (
                <>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  {code && (
                    <p className="text-xs text-muted-foreground">Code: {code}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
              )}
              <p className="text-sm text-muted-foreground">
                For <strong>Spotify</strong> sign-in: ensure the Supabase callback URL is added in the Spotify Developer Dashboard under Redirect URIs. See{' '}
                <a href="https://supabase.com/docs/guides/auth/social-login/auth-spotify" className="underline" target="_blank" rel="noopener noreferrer">Login with Spotify</a> and{' '}
                <a href="https://supabase.com/docs/guides/local-development/managing-config" className="underline" target="_blank" rel="noopener noreferrer">Managing config</a>.
              </p>
              <ul className="list-inside list-disc text-sm text-muted-foreground space-y-1">
                <li>
                  In <a href="https://developer.spotify.com/dashboard" className="underline" target="_blank" rel="noopener noreferrer">Spotify Developer Dashboard</a>: open your app → Edit Settings → Redirect URIs.
                </li>
                <li>
                  Add <code className="rounded bg-muted px-1">http://127.0.0.1:54406/auth/v1/callback</code> for local Supabase (port from supabase/config.toml), or use the URL from Supabase Dashboard → Auth → Providers → Spotify for hosted.
                </li>
                <li>
                  Set <code className="rounded bg-muted px-1">SPOTIFY_CLIENT_ID</code> and <code className="rounded bg-muted px-1">SPOTIFY_CLIENT_SECRET</code> in <code className="rounded bg-muted px-1">.env</code> at project root; run <code className="rounded bg-muted px-1">supabase start</code> (or <code className="rounded bg-muted px-1">pnpm run supabase:start</code> if using <code className="rounded bg-muted px-1">.env.local</code>).
                </li>
              </ul>
              <Link
                href="/auth/login"
                className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Back to login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
