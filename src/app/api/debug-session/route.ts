import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  const cookieStore = cookies() as any;
  const allCookies: Record<string, string> = {};
  for (const cookie of cookieStore.getAll()) {
    allCookies[cookie.name] = cookie.value;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { session }, error } = await supabase.auth.getSession();

  return NextResponse.json({
    cookies: allCookies,
    session,
    error,
  });
} 