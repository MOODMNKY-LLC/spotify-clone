import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'placeholder-key';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: unknown }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        const prevResponse = supabaseResponse;
        supabaseResponse = NextResponse.next({
          request,
        });
        // Preserve cookies from previous setAll so we don't lose session when Supabase calls setAll multiple times (e.g. token refresh)
        try {
          const existing = prevResponse.cookies.getAll();
          existing.forEach((c) => {
            supabaseResponse.cookies.set(c.name, c.value);
          });
        } catch {
          // ignore if getAll not available
        }
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as Parameters<NextResponse['cookies']['set']>[2])
        );
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Connection failed; return response without updated session
  }

  return supabaseResponse;
}
