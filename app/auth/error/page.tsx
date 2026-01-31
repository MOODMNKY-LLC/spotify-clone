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
  const isSpotifyTokensNotSaved = code === 'spotify_tokens_not_saved'

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {isSpotifyTokensNotSaved ? "Spotify session couldn't be saved" : 'Sorry, something went wrong.'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSpotifyTokensNotSaved ? (
                <>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <p className="text-sm text-muted-foreground">
                    In <strong>production</strong>, the server must have <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code> set so your Spotify session can be stored. Without it, &quot;From Spotify&quot; playlists will stay empty and Reconnect Spotify will not fix it.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Fix:</strong> In your hosting (e.g. Vercel → Project → Settings → Environment Variables), add <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code> with the <strong>service_role</strong> value from Supabase Dashboard → Project Settings → API. Redeploy, then try &quot;Reconnect Spotify&quot; again from Home.
                  </p>
                </>
              ) : description ? (
                <>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  {code && (
                    <p className="text-xs text-muted-foreground">Code: {code}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
              )}
              {!isSpotifyTokensNotSaved && (
              <>
              <p className="text-sm text-muted-foreground">
                In <strong>production</strong>, add your app&apos;s callback URL to Supabase so redirects work:
              </p>
              <ul className="list-inside list-disc text-sm text-muted-foreground space-y-1">
                <li>
                  Supabase Dashboard → <a href="https://supabase.com/dashboard/project/_/auth/url-configuration" className="underline" target="_blank" rel="noopener noreferrer">Auth → URL Configuration</a> → Redirect URLs.
                </li>
                <li>
                  Add <code className="rounded bg-muted px-1">https://muzik.moodmnky.com/auth/callback</code> (and optionally <code className="rounded bg-muted px-1">https://muzik.moodmnky.com/auth/oauth</code>) to Redirect URLs. Set <strong>Site URL</strong> to <code className="rounded bg-muted px-1">https://muzik.moodmnky.com</code>.
                </li>
                <li>
                  Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_SITE_URL</code> in production (e.g. Vercel) to <code className="rounded bg-muted px-1">https://muzik.moodmnky.com</code> so auth redirects go to the right place.
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                For <strong>Spotify</strong> sign-in: also add the Supabase callback URL in the <a href="https://developer.spotify.com/dashboard" className="underline" target="_blank" rel="noopener noreferrer">Spotify Developer Dashboard</a> → your app → Edit Settings → Redirect URIs (use the value from Supabase Dashboard → Auth → Providers → Spotify). See <a href="https://supabase.com/docs/guides/auth/social-login/auth-spotify" className="underline" target="_blank" rel="noopener noreferrer">Login with Spotify</a>.
              </p>
              </>
              )}
              <div className="flex flex-col gap-2">
                <Link
                  href={isSpotifyTokensNotSaved ? '/' : '/auth/login'}
                  className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {isSpotifyTokensNotSaved ? 'Go to Home' : 'Back to login'}
                </Link>
                {isSpotifyTokensNotSaved && (
                  <Link
                    href="/auth/login"
                    className="inline-block text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Back to login
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
