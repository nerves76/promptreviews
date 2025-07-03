import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log("🔗 Auth callback for password reset triggered");
  console.log("📝 Code parameter:", code ? "Present" : "Missing");

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
      
      console.log("✅ Session exchange successful for user:", data.user?.email);
      
    } catch (error) {
      console.error("❌ Error in password reset callback:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent("Password reset failed")}`,
      );
    }
  }

  // Redirect to reset password page
  console.log("✅ Redirecting to reset password page");
  return NextResponse.redirect(`${requestUrl.origin}/reset-password`);
}
