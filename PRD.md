# Product Requirements Document: MNKY MUZIK

## Overview and objectives

MNKY MUZIK is a PWA that combines a local/self-hosted music stack (Navidrome, Lidarr) with optional Spotify integration and AI-powered discovery. Users can:

- Stream and manage music from Navidrome and uploaded songs (Supabase).
- Connect Spotify to see playlists, saved tracks, and recommendations on the home page and in account.
- Request new music via Lidarr (artist/album) with enriched search (Spotify, MusicBrainz, Navidrome “already in library”).
- Use AI to generate playlists from natural-language prompts and to describe search.
- Subscribe (Stripe) or use beta access to unlock playback.

The app targets users who want one place to browse local library + Spotify, request downloads via Lidarr, and use AI for discovery, while keeping playback gated by subscription or beta.

---

## Target audience

- Users who run or have access to Navidrome and optionally Lidarr.
- Users who want to connect Spotify for discovery and profile (playlists, liked, recommendations) without leaving the app.
- Users who want to “request” music (artist/album) and have it appear in their library via Lidarr.
- Users who prefer subscription or invite-only (beta) access for playback.

---

## Core features and functionality

### Authentication and account

- **Auth**: Email/password sign-up, login, confirm, forgot password, update password (Supabase Auth).
- **Spotify OAuth**: Sign in with Spotify; session includes `provider_token` and `provider_refresh_token` for user-scoped Spotify API. Token refresh is implemented server-side when Spotify returns 401.
- **Account page**: When Spotify is connected, fetches and displays Spotify profile (avatar, display name, email, product, followers, “Open in Spotify”). Shows app augments: role (admin/beta), beta expiry, subscription status, customer portal link. “Reconnect Spotify” when session expired.
- **Beta access**: See [Beta access](#beta-access) below.

### Home

- **Welcome + quick links**: “Liked Songs”, MNKY Recommends (Chill Vibes, Focus Mode, Late Night → search).
- **From Spotify** (when connected): Playlists, saved tracks, recommendations (with “Reconnect Spotify” on 401).
- **Create with AI**: Prompt → AI playlist from catalog (Navidrome + Supabase; optional Spotify seed when linked).
- **Navidrome sections**: Recently played, newest albums, random picks, “From your liked”.
- **Newest songs**: Grid of Supabase `songs`.

### Search

- **Unified search**: Query hits Supabase (`getSongsByTitle`) and Navidrome search when configured.
- **Describe search**: When AI is configured, natural-language query → `/api/search/ai` → search terms → songs + Navidrome results.
- **SearchContent**: Renders songs and Navidrome results (tracks, albums, artists).

### Liked

- Combined liked tracks (Supabase `liked_songs` + Navidrome `liked_navidrome_tracks`), like button, play, add to queue, play next.

### Library and playback

- **Library (sidebar)**: “Your Library” from Supabase songs; “+” opens Upload modal (or Auth/Subscribe if not allowed).
- **Upload modal**: Upload song + image to Supabase storage, insert into `songs`.
- **Player**: Play/pause, next/previous, progress, volume, shuffle, repeat (one/all), queue drawer, expanded now-playing.
- **Queue**: Add to queue, play next, reorder/remove.
- **Navidrome scrobbling**: Playback completion calls `/api/navidrome/scrobble` for Navidrome tracks.
- **Download for offline**: “Request download” (or “Download for offline”) on track/queue/now-playing: sends artist + album (or artist) to Lidarr so the track becomes available in Navidrome when Lidarr finishes.

### Navidrome (when configured)

- Browse: albums (newest, recent), album by ID, artist by ID, search, stream, cover art API.
- Playlists: list and playlist by ID; playlist page with track list.
- Album/Artist pages: `/album/[id]`, `/artist/[id]` with cover, tracks, albums grid.

### Request (Lidarr)

- **Request page**: Single search → `/api/request/search`.
- **Aggregated search**: Lidarr artist + album lookup; Spotify enrichment (artwork, link, genres); Navidrome “already in library”; optional MusicBrainz enrichment (disambiguation, release date) with rate limit.
- **RequestContent**: Artist/album rows with image, name, “Already in library”, genres, overview (expandable), request button; toasts on success.
- **Lidarr request API**: POST `/api/lidarr/request` (artist or album); POST `/api/lidarr/request-track` for “request this track” (add album/artist to Lidarr).

### AI

- **Configured check**: `/api/ai/configured`.
- **AI playlist**: POST `/api/ai/playlist` — prompt → suggestions from catalog (Navidrome + Supabase; optional Spotify saved/top/recent as seed when token available).
- **Search describe**: GET `/api/search/ai?q=…` — natural-language → search terms → songs + Navidrome.

### Subscription and payments

- **Stripe**: Checkout session, customer portal, webhooks (product/price/subscription) synced to Supabase.
- **Subscribe modal**: Plan selection, checkout redirect; beta code entry (see [Beta access](#beta-access)).
- **canPlay**: True if user has active subscription, or role `admin`, or role `beta` with valid `beta_until`.

---

## Beta access

- **Assignment**: User enters a **beta code** (PIN) in the Subscribe modal under “Have a beta code?”.
- **PIN**: Server-only; value is set in environment variable `BETA_ACCESS_PIN` (e.g. in `.env` or `.env.local`). There is no in-app admin UI or “prompt” for the PIN — it is shared out-of-band (e.g. by the team).
- **Flow**: User submits the code via `POST /api/beta/verify` with body `{ pin: "..." }`. Server compares PIN to `BETA_ACCESS_PIN` using constant-time comparison. If valid, `public.users` is updated for the current user: `role = 'beta'`, `beta_until = now + 90 days`.
- **Effect**: `canPlay` is true for users with `role === 'beta'` and `beta_until` in the future (or `role === 'admin'`), so they can play without a Stripe subscription.

---

## Technical stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS, ShadCN UI.
- **Auth/backend**: Supabase (Auth, Postgres, Storage), Stripe.
- **Music**: Navidrome (Subsonic API), Lidarr (artist/album request), Spotify Web API (client credentials + OAuth user token).
- **AI**: OpenAI (e.g. gpt-4o-mini) for playlist and search describe.
- **Metadata**: MusicBrainz (optional enrichment for Request; rate-limited).

---

## Data model (high-level)

- **Supabase**: `users` (id, role, beta_until, …), `songs`, `liked_songs`, `liked_navidrome_tracks`, `products`, `prices`, `customers`, `subscriptions`. Storage buckets: `images`, `songs`.
- **Auth**: `auth.users`; trigger syncs to `public.users`.
- **Navidrome/Lidarr**: External; no app-owned DB. Lidarr uses MusicBrainz IDs internally.

---

## Security considerations

- **Auth**: Supabase Auth with PKCE; session in cookies; server reads session for API routes.
- **Spotify**: Provider token and refresh token in session; refresh on 401 server-side; no long-term storage of raw tokens outside session.
- **Beta PIN**: Constant-time compare; env-only; no logging of PIN.
- **Stripe**: Webhook signature verification; subscription status in Supabase.
- **RLS**: Enabled on Supabase tables; policies per docs and migrations.

---

## Development phases (reference)

1. Auth, account, home (Spotify profile + reconnect).
2. Spotify token refresh (server-side on 401).
3. PRD and beta documentation.
4. Request: MusicBrainz enrichment, UI polish (skeletons, empty/error states).
5. Download for offline (Lidarr request-track).
6. AI: optional Spotify seed for playlist, clearer errors.
7. Account page: full Spotify-like sections (profile, subscription, beta).
8. Nice-to-haves: typo fixes, Supabase/PWA docs.

---

## Potential challenges and solutions

- **Spotify provider_token missing after OAuth**: Ensure PKCE/callback and cookie handling so server receives session with `provider_token`; implement refresh-on-401 so expired tokens are refreshed once per request when possible.
- **Lidarr “single track”**: Lidarr has artist/album only; “request track” is implemented by resolving to album (or artist) and calling existing add album/artist API.
- **MusicBrainz rate limit**: Use ~1 req/s and limit to first N artists/albums when enriching.

---

## Future expansion

- “Because you like X” recommendation labels (Spotify or local likes).
- Optional “Disconnect Spotify” (re-auth with email only).
- Richer PWA offline/install experience.
- Optional Supabase Analytics on Windows (Docker `tcp://localhost:2375`) and `supabase link` for version alignment.
