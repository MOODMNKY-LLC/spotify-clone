import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Server-side sign-out: clears the session cookies and redirects.
 * Use this so logout is reliable (cookie clearing happens on the response).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get('next') ?? '/';
  const safeNext = next.startsWith('/') ? next : '/';

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(safeNext, request.url));
}
