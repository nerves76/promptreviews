import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

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
      console.log("🔄 Exchanging code for session...");
      
      // Use the code to establish a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("❌ Session exchange error:", error);
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`,
        );
      }
      
      if (data.user) {
        console.log("✅ Session established for user:", data.user.email);
      }
      
    } catch (error) {
      console.error("❌ Error in auth callback:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent("Authentication failed")}`,
      );
    }
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

  return NextResponse.redirect(redirectUrl);
}
