import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/utils/resend-welcome";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log("🔗 Auth callback triggered with URL:", request.url);
  console.log("📝 Code parameter:", code ? "Present" : "Missing");

  if (!code) {
    console.error("❌ No code parameter found in callback URL");
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=Invalid code`,
    );
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    );

    console.log("🔄 Exchanging code for session...");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("❌ Session exchange error:", sessionError);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(sessionError.message)}`,
      );
    }

    if (!session?.user) {
      console.error("❌ No user in session after code exchange");
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/sign-in?error=No user in session`,
      );
    }

    console.log("✅ Session exchange successful for user:", session.user.email);
    console.log("📧 Email confirmed at:", session.user.email_confirmed_at);

    // Ensure user is linked to an account
    const { id: userId, email } = session.user;
    const { data: accountLinks, error: accountLinksError } = await supabase
      .from("account_users")
      .select("account_id")
      .eq("user_id", userId);

    let isNewUser = false;
    if (!accountLinks || accountLinks.length === 0) {
      isNewUser = true;
      console.log("🆕 Creating new account for user:", email);
      // No account found, create one and link user as owner
      const { data: newAccount, error: createAccountError } = await supabase
        .from("accounts")
        .insert([{ name: email }])
        .select()
        .single();

      if (!createAccountError && newAccount) {
        console.log("✅ Account created successfully");
        await supabase
          .from("account_users")
          .insert([
            {
              account_id: newAccount.id,
              user_id: userId,
              role: "owner",
            },
          ]);
        console.log("✅ User linked to account as owner");
      } else {
        console.error("❌ Error creating account:", createAccountError);
      }
    } else {
      console.log("✅ User already has account links");
    }

    // Send welcome email for new users
    if (isNewUser && email) {
      try {
        // Extract first name from user metadata or email
        let firstName = "there";
        if (session.user.user_metadata?.first_name) {
          firstName = session.user.user_metadata.first_name;
        } else if (email) {
          firstName = email.split("@")[0];
        }

        await sendWelcomeEmail(email, firstName);
        console.log("📧 Welcome email sent to:", email);
      } catch (emailError) {
        console.error("❌ Error sending welcome email:", emailError);
        // Don't fail the signup if email fails
      }
    }

    // Wait for the session to be set
    console.log("⏳ Waiting for session to be set...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("✅ Redirecting to dashboard");
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  } catch (error) {
    console.error("❌ Error in callback:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`,
    );
  }
}
