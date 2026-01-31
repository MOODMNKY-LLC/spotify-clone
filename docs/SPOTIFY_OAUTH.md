# Spotify OAuth (Supabase Auth)

This app uses Spotify as an OAuth provider alongside email/password. The same Spotify app credentials are used for:

- **Client Credentials** (server): public metadata in `libs/spotify.ts` (search, artist, album).
- **OAuth login**: Supabase Auth → Spotify; after sign-in the session includes `provider_token` for user-scoped Spotify Web API calls.

**User flow**: Login/Sign up → authenticate with Spotify → redirect to home → "From Spotify" section loads playlists, saved tracks, and recommendations. The browser client uses PKCE by default (`@supabase/ssr`); the code is exchanged in `/auth/callback` on the first request and session cookies are set on the redirect response.

**Critical: Cookie handling in callback route** - The `/app/auth/callback/route.ts` callback route **MUST preserve ALL cookie options** from Supabase (httpOnly, maxAge, expires, domain, path, sameSite, secure). Overriding these options breaks session persistence. The implementation preserves all Supabase-provided options and only sets defaults if Supabase didn't provide them.

**Await order in callback**: The callback must (1) `await supabase.auth.exchangeCodeForSession(code)` so the session (including `provider_token`) is received, (2) read tokens from the returned session immediately, (3) `await` the token upsert to the DB, and only then (4) return the redirect. Returning the redirect before token persistence completes can cause the client to land on home before the DB has the row, so `/api/spotify/user/*` returns 401.

## Redirect URIs (Spotify Developer Dashboard)

1. Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → your app → Edit Settings.
2. Under **Redirect URIs**, add:
   - **Local Supabase**: `http://127.0.0.1:54406/auth/v1/callback` (match api port in supabase/config.toml)
   - **Hosted Supabase**: get the exact URL from [Supabase Dashboard](https://supabase.com/dashboard) → your project → Authentication → Providers → Spotify → Copy callback URL (e.g. `https://<project-ref>.supabase.co/auth/v1/callback`).
3. Save.

## User Access Restrictions (CRITICAL)

**New Spotify apps start in Development Mode**, which restricts OAuth login to:
- The app owner/developer (you)
- Up to 25 users you explicitly invite

**If other users cannot log in with Spotify**, this is likely because your app is in Development Mode and they haven't been invited.

### Development Mode: Inviting Users (Up to 25)

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → your app
2. Navigate to **Settings → Users and Access**
3. Click **"Add User"** and enter their Spotify email addresses
4. Users will receive an invitation email and can then log in

### Extended Quota Mode: Unlimited Users

To allow unlimited users to log in, you must submit a **Quota Extension Request**:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → your app
2. Navigate to **Settings → Extension Request**
3. Fill out the Quota Extension form with:
   - Application information and screenshots
   - APIs/SDKs used
   - Justification for OAuth scopes
   - Security/privacy compliance details
   - Demo/testing instructions
4. **Review time**: Approximately 6 weeks (may require back-and-forth)

**Important (as of May 15, 2025)**: Spotify updated extended access criteria. Extended access is now reserved for apps with:
- Established, scalable, and impactful use cases
- Alignment with Spotify's platform strategy
- Focus on artist and creator discovery

See [Spotify's Quota Extension documentation](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) for details.

## Environment variables

### Required for Spotify OAuth

- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`: same as for Client Credentials.
- For **local** Supabase: put them in `.env` at project root (same folder as `supabase/`). Run `supabase start` from project root so the CLI loads them. If you keep secrets only in `.env.local`, run `pnpm run supabase:start` instead so Supabase receives the vars.

### Critical: Supabase environment variables

The callback route validates these environment variables at startup and will fail fast with clear error messages if they're missing:

- `NEXT_PUBLIC_SUPABASE_URL` - Must be set and not a placeholder
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Must be set and not a placeholder
- `SUPABASE_SERVICE_ROLE_KEY` - **CRITICAL**: Required in production for saving Spotify tokens to the database. If missing in production, authentication will succeed but tokens won't be persisted, causing "From Spotify" features to fail.

**Important**: All three variables must be from the **same Supabase project**. Mixing URLs and keys from different projects will cause authentication and token persistence to fail.

## Hosted Supabase

In Supabase Dashboard → Authentication → Providers → Spotify: enable Spotify and enter Client ID and Client Secret. The callback URL shown there must be added to your Spotify app's Redirect URIs.

## Production: Supabase redirect URLs

In **production**, users can see "error after authenticating" if the app's callback URL is not allowed in Supabase:

1. Supabase Dashboard → [Auth → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration).
2. Set **Site URL** to your production origin (e.g. `https://muzik.example.com`).
3. Under **Redirect URLs**, add exactly:
   - `https://YOUR-PRODUCTION-DOMAIN/auth/callback`
   (and optionally `https://YOUR-PRODUCTION-DOMAIN/auth/oauth`).
4. Set `NEXT_PUBLIC_SITE_URL` in production env to that same origin so post-login redirects use the correct URL.

## Token expiry and refresh

Spotify access tokens expire (typically after 1 hour). Supabase does **not** refresh provider tokens; when Supabase refreshes its own session via `getUser()`, it sets `provider_token` to null. To avoid this:

- The proxy skips `updateSession` (which calls `getUser()`) for **`/api/*`** and **`/auth/callback`**. Skipping the callback ensures the OAuth route handler alone sets session cookies (no session refresh touching PKCE or overwriting the new session). Skipping `/api/*` avoids refreshing before API routes read tokens from the DB.
- Page requests (e.g. `/`) still run the proxy for normal Supabase session refresh; after refresh the session no longer has `provider_token`, so API routes rely on **`user_spotify_tokens`** (saved in the callback).
- The API routes use `refreshSpotifyToken()` when the access token is expired; they require `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in the environment.

If user-scoped Spotify features (playlists, saved tracks, recommendations) stop loading or return 401:

- The app shows "Your Spotify session expired. Reconnect Spotify" and a link to sign in again.
- Ensure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set (needed for token refresh).
- See [Spotify: Refreshing tokens](https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens).

## Production: "From Spotify" / session persistence

In production, the "From Spotify" section (playlists, saved tracks, recommendations) can fail to show even after a successful Spotify sign-in. Common causes:

### 1. Cookie options (CRITICAL FIX)

**The callback route MUST preserve ALL cookie options from Supabase.** The implementation in `/app/auth/callback/route.ts` preserves all options (httpOnly, maxAge, expires, domain, path, sameSite, secure) that Supabase provides. It only sets defaults if Supabase didn't provide them:

- `secure: true` is set for HTTPS if Supabase didn't already set it
- `path: '/'` is set if Supabase didn't provide a path
- `sameSite: 'lax'` is set if Supabase didn't provide sameSite

**DO NOT override cookie options** - This breaks session persistence. The previous implementation that forced `path: '/'` and `sameSite: 'lax'` while ignoring other options (httpOnly, maxAge, expires, domain) caused sessions to not persist. Always preserve all options from Supabase.

### 2. Token persistence

Supabase refreshes the session on page loads (via the proxy's `updateSession`), which clears `provider_token`. The app persists Spotify tokens in `user_spotify_tokens` during the callback using the **service role** client so the insert always succeeds (no RLS/cookie dependency). Ensure:

- The `user_spotify_tokens` migration has been applied in your production Supabase project.
- **`SUPABASE_SERVICE_ROLE_KEY`** is set in your **production** environment (e.g. Vercel → Project → Settings → Environment Variables). The callback route validates this at startup and will redirect to an error page if it's missing in production.
- The service role key must be from the **same Supabase project** as `NEXT_PUBLIC_SUPABASE_URL`. Mixing projects causes token persistence to fail.
- If the callback fails to save tokens, check server logs for `[auth/callback] Failed to save Spotify tokens to database:` - the error message includes detailed debugging information.

### 3. Environment variable validation

The callback route now validates all required environment variables at startup:
- Missing `NEXT_PUBLIC_SUPABASE_URL` → redirects to error page with clear message
- Missing Supabase API key → redirects to error page with clear message  
- Missing `SUPABASE_SERVICE_ROLE_KEY` in production → redirects to error page with clear message
- Invalid service role key format (too short) → logs warning but continues

### 4. Redirect URLs

In Supabase Dashboard → Auth → URL Configuration, add your production callback under Redirect URLs (e.g. `https://your-domain.com/auth/callback`). The Site URL should match your production origin.

### 5. API routes and cookies

Session cookies preserve all options from Supabase, ensuring they work correctly with same-origin requests including `/api/*`. The client calls `/api/spotify/user/linked` and other Spotify user APIs with `credentials: 'include'`. If you see 401 on `/api/spotify/user/recommendations` in production, check the response body: `code: 'NO_SESSION'` means the session cookie was not sent or is invalid; `code: 'NO_SPOTIFY_TOKENS'` means the user is signed in but tokens were never saved (fix by setting `SUPABASE_SERVICE_ROLE_KEY` and signing in with Spotify again).

### 6. Linked check retries

After redirect, the client may get a refreshed session without `provider_token`. The app then checks the DB via `/api/spotify/user/linked` and retries a few times (0 ms, 400 ms, 1200 ms) to handle brief DB/cookie propagation delay. If it still shows as not linked, ensure the callback successfully wrote to `user_spotify_tokens` (see point 2).

## Troubleshooting: Authentication and session persistence

### When `SUPABASE_SERVICE_ROLE_KEY` is set but 401 persists

If the key is set in production but "From Spotify" still doesn't load and `/api/spotify/user/recommendations` returns 401, use these checks:

1. **Check server logs after "Reconnect Spotify"**
   - **`[auth/callback] Spotify tokens saved successfully for user <id>`** → Callback wrote to the DB. Then the problem is likely the **session cookie not reaching the API** (see step 3) or a **different Supabase project** (see step 4).
   - **`[auth/callback] Session has no provider_token/provider_refresh_token`** → Supabase is not returning Spotify tokens. In **Supabase Dashboard → Authentication → Providers → Spotify**: ensure Spotify is enabled and that the same Client ID/Secret as in your Spotify app are set. Confirm the Supabase callback URL is in your Spotify app's Redirect URIs.
   - **`[auth/callback] Failed to save Spotify tokens to database:`** → Upsert failed. Log message includes detailed error information: ensure **table `user_spotify_tokens` exists** in the **same** Supabase project (run the migration there), and that **`NEXT_PUBLIC_SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** are from the **same** Supabase project (not dev URL with prod key or vice versa).
   - **`[auth/callback] exchangeCodeForSession failed:`** → Code exchange failed. Check the error code and message in logs. Common causes: expired code, PKCE mismatch, or Supabase configuration issues.

2. **401 response body** (Network tab → recommendations request → Response)
   - **`code: 'NO_SESSION'`** → The request had no valid session (cookie not sent or invalid). This indicates a cookie persistence issue. Check that:
     - Cookies are being set correctly (check browser DevTools → Application → Cookies)
     - Cookie options are preserved from Supabase (httpOnly, maxAge, expires, etc.)
     - Same-origin, cookie path, and redirect URL match the app origin (e.g. `https://muzik.moodmnky.com`)
   - **`code: 'NO_SPOTIFY_TOKENS'`** → Session is present but no Spotify tokens in DB or session. So either the callback never saved (check logs above) or the session never had `provider_token` (check Supabase Spotify provider).

3. **Same Supabase project**  
   `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must belong to the **same** Supabase project. If the URL is for project A and the key is for project B, the callback's upsert will fail (wrong key for that URL). The callback route validates environment variables but cannot detect project mismatches - ensure they match manually.

4. **Table in production**  
   In **Supabase Dashboard → Table Editor**, confirm `user_spotify_tokens` exists. If not, run the migration (e.g. `supabase/migrations/20250130180000_user_spotify_tokens.sql`) on the **production** project (Dashboard → SQL Editor or `supabase db push` against prod).

### Common issues and fixes

- **Sessions not persisting after redirect**: This was caused by overriding cookie options. The fix preserves all Supabase cookie options. If you're still experiencing this, verify the callback route implementation matches the current code in `/app/auth/callback/route.ts`. The `setAll` callback must preserve all options from Supabase, not just path and sameSite.

- **"Server configuration error" on callback**: The callback route validates environment variables at startup. Check that all required variables are set correctly in production. The error message will indicate which variable is missing.

- **Tokens saved but API returns 401**: Check that cookies are being sent with API requests (browser DevTools → Network → Headers → Cookie). Verify the session cookie has the correct options (httpOnly, secure, sameSite, maxAge, expires). If cookies are missing or have wrong options, the callback route may not be preserving Supabase's cookie options correctly.
