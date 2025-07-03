import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, getSessionOrMock } from "@/utils/supabaseClient";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies: Record<string, string> = {};
  for (const cookie of cookieStore.getAll()) {
    allCookies[cookie.name] = cookie.value;
  }

  const supabase = createServerClient();

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
