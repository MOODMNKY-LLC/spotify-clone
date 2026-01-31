# Spotify OAuth (Supabase Auth)

This app uses Spotify as an OAuth provider alongside email/password. The same Spotify app credentials are used for:

- **Client Credentials** (server): public metadata in `libs/spotify.ts` (search, artist, album).
- **OAuth login**: Supabase Auth → Spotify; after sign-in the session includes `provider_token` for user-scoped Spotify Web API calls.

**User flow**: Login/Sign up → authenticate with Spotify → redirect to home → "From Spotify" section loads playlists, saved tracks, and recommendations. The browser client uses PKCE by default (`@supabase/ssr`); the code is exchanged in `/auth/callback` on the first request and session cookies are set on the redirect response.

**Await order in callback**: The callback must (1) `await supabase.auth.exchangeCodeForSession(code)` so the session (including `provider_token`) is received, (2) read tokens from the returned session immediately, (3) `await` the token upsert to the DB, and only then (4) return the redirect. Returning the redirect before token persistence completes can cause the client to land on home before the DB has the row, so `/api/spotify/user/*` returns 401.

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
   - **`SUPABASE_SERVICE_ROLE_KEY`** is set in your **production** environment (e.g. Vercel → Project → Settings → Environment Variables). If it is missing or still the placeholder, the callback logs `[auth/callback] SUPABASE_SERVICE_ROLE_KEY is missing or placeholder in production` and does not write tokens, so `/api/spotify/user/recommendations` and other Spotify user APIs return 401.
   - If the callback fails to save tokens, check server logs for `[auth/callback] Failed to save Spotify tokens`.

3. **Redirect URLs**: In Supabase Dashboard → Auth → URL Configuration, add your production callback under Redirect URLs (e.g. `https://your-domain.com/auth/callback`). The Site URL should match your production origin.

4. **API routes and cookies**: Session cookies are set with `path: '/'` in the callback so they are sent to all same-origin requests including `/api/*`. The client calls `/api/spotify/user/linked` and other Spotify user APIs with `credentials: 'include'`. If you see 401 on `/api/spotify/user/recommendations` in production, check the response body: `code: 'NO_SESSION'` means the session cookie was not sent or is invalid; `code: 'NO_SPOTIFY_TOKENS'` means the user is signed in but tokens were never saved (fix by setting `SUPABASE_SERVICE_ROLE_KEY` and signing in with Spotify again).

5. **Linked check retries**: After redirect, the client may get a refreshed session without `provider_token`. The app then checks the DB via `/api/spotify/user/linked` and retries a few times (0 ms, 400 ms, 1200 ms) to handle brief DB/cookie propagation delay. If it still shows as not linked, ensure the callback successfully wrote to `user_spotify_tokens` (see point 2).

## When `SUPABASE_SERVICE_ROLE_KEY` is set but 401 persists

If the key is set in production but "From Spotify" still doesn’t load and `/api/spotify/user/recommendations` returns 401, use these checks:

1. **Vercel (or host) logs after "Reconnect Spotify"**
   - **"Spotify tokens saved successfully"** → Callback wrote to the DB. Then the problem is likely the **session cookie not reaching the API** (see step 3) or a **different Supabase project** (see step 4).
   - **"Session has no provider_token/provider_refresh_token"** → Supabase is not returning Spotify tokens. In **Supabase Dashboard → Authentication → Providers → Spotify**: ensure Spotify is enabled and that the same Client ID/Secret as in your Spotify app are set. Confirm the Supabase callback URL is in your Spotify app’s Redirect URIs.
   - **"Failed to save Spotify tokens: ..."** → Upsert failed. Log message includes a hint: ensure **table `user_spotify_tokens` exists** in the **same** Supabase project (run the migration there), and that **`NEXT_PUBLIC_SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** are from the **same** Supabase project (not dev URL with prod key or vice versa).

2. **401 response body** (Network tab → recommendations request → Response)
   - **`code: 'NO_SESSION'`** → The request had no valid session (cookie not sent or invalid). Same-origin, cookie path, and redirect URL must match the app origin (e.g. `https://muzik.moodmnky.com`).
   - **`code: 'NO_SPOTIFY_TOKENS'`** → Session is present but no Spotify tokens in DB or session. So either the callback never saved (check logs above) or the session never had `provider_token` (check Supabase Spotify provider).

3. **Same Supabase project**  
   `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must belong to the **same** Supabase project. If the URL is for project A and the key is for project B, the callback’s upsert will fail (wrong key for that URL).

4. **Table in production**  
   In **Supabase Dashboard → Table Editor**, confirm `user_spotify_tokens` exists. If not, run the migration (e.g. `supabase/migrations/20250130180000_user_spotify_tokens.sql`) on the **production** project (Dashboard → SQL Editor or `supabase db push` against prod).
