# Vercel environment variables checklist

Use this list to ensure your **production** (and optionally Preview/Development) app on Vercel has all required environment variables. Set them in:

**Vercel Dashboard → Your project → Settings → Environment Variables.**

---

## Required for production

| Variable | Where to get it | Notes |
|----------|------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | Use **production** project URL. **Must match** the project for `SUPABASE_SERVICE_ROLE_KEY`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same → Project API keys → `anon` public | Or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Must match** the project for `NEXT_PUBLIC_SUPABASE_URL`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Same → `service_role` (secret) | **CRITICAL**: Server-only; never expose in client. Required for Spotify OAuth token persistence. If missing in production, authentication succeeds but tokens won't be saved, causing "From Spotify" features to fail. **Must match** the project for `NEXT_PUBLIC_SUPABASE_URL`. |
| `DATABASE_URL` | Supabase Dashboard → Database → Connection string → URI | Use “Session mode” or “Transaction” pooler if needed. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API keys → Publishable key | Use **live** key for production. |
| `STRIPE_SECRET_KEY` | Same → Secret key | Use **live** key for production. |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → Add endpoint → Signing secret | Endpoint URL: `https://YOUR-DOMAIN/api/webhooks`. |
| `SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard → your app | Same app as used in Supabase Auth → Spotify. |
| `SPOTIFY_CLIENT_SECRET` | Same → Client Secret | |
| `NAVIDROME_URL` | Your Navidrome server | e.g. `https://navidrome.example.com`. |
| `NAVIDROME_USER` | Navidrome user for the app | Dedicated app user recommended. |
| `NAVIDROME_PASSWORD` | That user’s password | |
| `NEXT_PUBLIC_SITE_URL` | Your app’s canonical URL | e.g. `https://muzik.moodmnky.com`. Required for auth redirects and link previews. |

---

## Optional but recommended

| Variable | Where to get it | Notes |
|----------|------------------|--------|
| `LIDARR_URL` | Your Lidarr server | Required for “Request” / add artist features. |
| `LIDARR_API_KEY` | Lidarr → Settings → General → API Key | |
| `OPENAI_API_KEY` | OpenAI → API keys | Required for AI playlists / search / recommendations. |
| `BETA_ACCESS_PIN` | You choose | Server-only; optional beta gate. |

---

## Optional (feature-specific)

| Variable | When to set | Notes |
|----------|-------------|--------|
| `LIDARR_ROOT_FOLDER_PATH` | When adding artists via API | Default root folder path. |
| `LIDARR_QUALITY_PROFILE_ID` | Same | Default quality profile. |
| `LIDARR_METADATA_PROFILE_ID` | Same | Default metadata profile. |
| `NEXT_PUBLIC_DEV_BYPASS_SUBSCRIPTION` | Only in Preview/Dev if you want to bypass subscription | Set to `true`; **do not** use in Production. |
| `SUPABASE_STORAGE_S3_URL` | If using Supabase Storage S3 API | Supabase or external S3-compatible. |
| `SUPABASE_STORAGE_ACCESS_KEY` | Same | |
| `SUPABASE_STORAGE_SECRET_KEY` | Same | |
| `SUPABASE_STORAGE_REGION` | Same | e.g. `us-east-1`. |
| `GITHUB_CLIENT_ID` / `GITHUB_SECRET` | If Supabase Auth → GitHub is enabled | From GitHub OAuth App. |
| `MINIO_*` | If using MinIO instead of Supabase Storage | See .env.example “Optional – External MinIO” section. |

---

## Sync from local to Vercel

1. **Do not** copy `.env.local` or `.env` into the repo (they are gitignored and may contain secrets).
2. Open **Vercel → Project → Settings → Environment Variables**.
3. For each variable you use in **production** (see tables above), add it in Vercel with:
   - **Key**: exact name (e.g. `NEXT_PUBLIC_SITE_URL`).
   - **Value**: production value (from Supabase/Stripe/Navidrome/etc.).
   - **Environments**: check **Production** (and optionally Preview, Development).
4. Redeploy after adding or changing variables so the new build picks them up.

---

## Quick reference: variables used by the app

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- **Stripe**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Spotify**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- **Navidrome**: `NAVIDROME_URL`, `NAVIDROME_USER`, `NAVIDROME_PASSWORD`
- **Lidarr**: `LIDARR_URL`, `LIDARR_API_KEY`, optional `LIDARR_ROOT_FOLDER_PATH`, `LIDARR_QUALITY_PROFILE_ID`, `LIDARR_METADATA_PROFILE_ID`
- **OpenAI**: `OPENAI_API_KEY`
- **App**: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEV_BYPASS_SUBSCRIPTION`, `BETA_ACCESS_PIN`
