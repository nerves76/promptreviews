import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  console.log("🔗 Auth callback triggered");
  console.log("📝 Code parameter:", code ? "Present" : "Missing");
  console.log("📍 Next parameter:", next);
  console.log("🌐 Full URL:", request.url);

  if (code) {
    try {
      console.log("🔄 Exchanging code for session...");
      
      const cookieStore = cookies() as any;
      
      // Use server-side client with proper cookie handling (same pattern as debug-session)
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
      
      // Exchange code for session
      console.log("🔄 Calling exchangeCodeForSession...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("❌ Session exchange error:", error);
        console.error("❌ Error details:", { 
          message: error.message, 
          status: error.status,
          name: error.name 
        });
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`,
        );
      }
      
      console.log("✅ Session exchange result:", {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userEmail: data.user?.email,
        sessionExpiresAt: data.session?.expires_at
      });
      
      if (data.user) {
        console.log("✅ Session established for user:", data.user.email);
      }
      
    } catch (error) {
      console.error("❌ Error in auth callback:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent("Authentication failed")}`,
      );
    }
  } else {
    console.log("⚠️ No code parameter found in callback");
  }

  // Determine where to redirect
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

  console.log("🎯 Final redirect URL:", redirectUrl);
  return NextResponse.redirect(redirectUrl);
}
