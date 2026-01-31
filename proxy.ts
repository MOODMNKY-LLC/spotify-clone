import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Proxy runs before routes are rendered (Next.js 16+).
 * Replaces the deprecated middleware convention.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 *
 * Skip session refresh for /api/* routes: getUser() refreshes the Supabase session
 * and nulls provider_token (Spotify). API routes need provider_token for user-scoped
 * Spotify calls, so we must not run updateSession before them.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next({ request });
  }
  try {
    return await updateSession(request);
  } catch (e) {
    // Supabase unreachable (e.g. not running, or dev server in isolated env)
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[proxy] Supabase unreachable. Start with: supabase start. Skipping session refresh.',
        (e as Error)?.message ?? e
      );
    }
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
