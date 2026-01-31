/**
 * Public base URL for the app. Used for Open Graph and Twitter Card absolute URLs.
 * - Prefer NEXT_PUBLIC_SITE_URL (e.g. https://muzik.moodmnky.com)
 * - Else on Vercel: https://${VERCEL_URL}
 * - Else null; metadata can still use relative paths (crawlers resolve against request host)
 */
export function getBaseUrl(): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return site.startsWith('http') ? site : `https://${site}`;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return null;
}

/**
 * Origin (protocol + host) for auth redirects. Use in production so redirects
 * go to the canonical site URL, not an internal/proxy host.
 */
export function getSiteOrigin(): string | null {
  return getBaseUrl();
}
