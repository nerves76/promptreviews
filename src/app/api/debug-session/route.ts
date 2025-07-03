import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSessionOrMock } from "@/utils/supabaseClient";

export async function GET() {
  const cookieStore = await cookies();
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
    },
  );

  const {
    data: { session },
    error,
  } = await getSessionOrMock(supabase);

  return NextResponse.json({
    cookies: allCookies,
    session,
    error,
  });
}
