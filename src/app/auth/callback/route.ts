import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  console.log("🔗 Auth callback triggered");
  console.log("📝 Code parameter:", code ? "Present" : "Missing");
  console.log("📍 Next parameter:", next);
  
  // DEBUG: Log what environment variables we're actually seeing
  console.log("🔍 Environment Debug:");
  console.log("  SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("  SUPABASE_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET");

  if (code) {
    try {
      console.log("🔄 Creating Supabase client for session exchange...");
      
      // Create a fresh client for the auth callback
      const supabase = createClient(
        "http://127.0.0.1:54321",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
      );
      
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
