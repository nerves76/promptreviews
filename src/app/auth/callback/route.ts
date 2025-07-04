import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  console.log("🔗 Auth callback triggered");
  console.log("📝 Code parameter:", code ? "Present" : "Missing");
  console.log("📍 Next parameter:", next);

  if (code) {
    try {
      console.log("🔄 Creating Supabase client for session exchange...");
      
      // Create route handler client that properly handles cookies
      const supabase = createRouteHandlerClient({ cookies });
      
      console.log("🔄 Calling exchangeCodeForSession...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("❌ Session exchange error:", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`,
        );
      }
      
      console.log("✅ Session exchange success:", {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userEmail: data.user?.email
      });
      
    } catch (error) {
      console.error("❌ Auth callback error:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent("Authentication failed")}`,
      );
    }
  }

  // Determine redirect destination
  let redirectUrl;
  if (next === '/reset-password') {
    redirectUrl = `${requestUrl.origin}/reset-password`;
    console.log("🔄 Redirecting to reset password page");
  } else if (next) {
    redirectUrl = `${requestUrl.origin}${next}`;
    console.log("🔄 Redirecting to:", next);
  } else {
    redirectUrl = `${requestUrl.origin}/dashboard`;
    console.log("🔄 Redirecting to dashboard (default)");
  }

  console.log("🎯 Final redirect:", redirectUrl);
  return NextResponse.redirect(redirectUrl);
}
