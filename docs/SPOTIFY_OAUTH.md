# Spotify OAuth (Supabase Auth)

This app uses Spotify as an OAuth provider alongside email/password. The same Spotify app credentials are used for:

- **Client Credentials** (server): public metadata in `libs/spotify.ts` (search, artist, album).
- **OAuth login**: Supabase Auth → Spotify; after sign-in the session includes `provider_token` for user-scoped Spotify Web API calls.

## Redirect URIs (Spotify Developer Dashboard)

1. Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → your app → Edit Settings.
2. Under **Redirect URIs**, add:
   - **Local Supabase**: `http://127.0.0.1:54406/auth/v1/callback` (match api port in supabase/config.toml)
   - **Hosted Supabase**: get the exact URL from [Supabase Dashboard](https://supabase.com/dashboard) → your project → Authentication → Providers → Spotify → Copy callback URL (e.g. `https://<project-ref>.supabase.co/auth/v1/callback`).
3. Save.

## Environment variables

- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`: same as for Client Credentials.
- For **local** Supabase: put them in `.env` at project root (same folder as `supabase/`). Run `supabase start` from project root so the CLI loads them. If you keep secrets only in `.env.local`, run `pnpm run supabase:start` instead so Supabase receives the vars.

## Hosted Supabase

In Supabase Dashboard → Authentication → Providers → Spotify: enable Spotify and enter Client ID and Client Secret. The callback URL shown there must be added to your Spotify app’s Redirect URIs.

## Production: Supabase redirect URLs

In **production**, users can see “error after authenticating” if the app’s callback URL is not allowed in Supabase:

1. Supabase Dashboard → [Auth → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration).
2. Set **Site URL** to your production origin (e.g. `https://muzik.example.com`).
3. Under **Redirect URLs**, add exactly:
   - `https://YOUR-PRODUCTION-DOMAIN/auth/callback`
   (and optionally `https://YOUR-PRODUCTION-DOMAIN/auth/oauth`).
4. Set `NEXT_PUBLIC_SITE_URL` in production env to that same origin so post-login redirects use the correct URL.

## Token expiry and refresh

Spotify access tokens expire (typically after 1 hour). Supabase does **not** refresh provider tokens; when Supabase refreshes its own session via `getUser()`, it sets `provider_token` to null. To avoid this:

- The proxy skips `updateSession` (which calls `getUser()`) for `/api/*` routes. This keeps `provider_token` in the session when API routes read it.
- Page requests still run the proxy for normal Supabase session refresh.
- The API routes use `refreshSpotifyToken()` when the access token is expired; they require `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in the environment.

If user-scoped Spotify features (playlists, saved tracks, recommendations) stop loading or return 401:

- The app shows "Your Spotify session expired. Reconnect Spotify" and a link to sign in again.
- Ensure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set (needed for token refresh).
- See [Spotify: Refreshing tokens](https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens).

## Production: "From Spotify" / session persistence

In production, the "From Spotify" section (playlists, saved tracks, recommendations) can fail to show even after a successful Spotify sign-in. Common causes:

1. **Cookie options**: The OAuth callback sets session cookies on the redirect response. In production (HTTPS), cookies must have `SameSite=Lax` (so they are set when the user lands from the Spotify redirect) and `Secure: true`. The callback applies these when the redirect URL is HTTPS.

2. **Token persistence**: Supabase refreshes the session on page loads (via the proxy’s `updateSession`), which clears `provider_token`. The app persists Spotify tokens in `user_spotify_tokens` during the callback using the **service role** client so the insert always succeeds (no RLS/cookie dependency). Ensure:
   - The `user_spotify_tokens` migration has been applied in your production Supabase project.
   - **`SUPABASE_SERVICE_ROLE_KEY`** is set in production (callback uses it to write tokens; without it the insert fails and "From Spotify" stays empty).
   - If the callback fails to save tokens, check server logs for `[auth/callback] Failed to save Spotify tokens`.

3. **Redirect URLs**: In Supabase Dashboard → Auth → URL Configuration, add your production callback under Redirect URLs (e.g. `https://your-domain.com/auth/callback`). The Site URL should match your production origin.

4. **API routes and cookies**: The client calls `/api/spotify/user/linked` with `credentials: 'include'` so cookies are sent. If "From Spotify" is empty in production, confirm the session cookie is present and sent on same-origin API requests (e.g. in DevTools → Application → Cookies).
