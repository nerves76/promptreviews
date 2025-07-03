import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabaseClient';
import { sendWelcomeEmail } from "@/utils/resend-welcome";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  console.log("🔗 Auth callback triggered with URL:", request.url);
  console.log("📝 Code parameter:", code ? "Present" : "Missing");
  console.log("📝 Type parameter:", type || "Not specified");

  if (!code) {
    console.error("❌ No code parameter found in callback URL");
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=Invalid code`,
    );
  }

  // Handle password reset codes - redirect to reset-password page
  if (type === 'recovery') {
    console.log("🔄 Password reset detected (type=recovery), redirecting to reset-password page");
    return NextResponse.redirect(
      `${requestUrl.origin}/reset-password?code=${code}`,
    );
  }

  try {
    const cookieStore = await cookies();
    
    // Use regular client for session exchange (not service role)
    const supabaseForSession = createClient(
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

    // Use service key for database operations
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    console.log("🔄 Exchanging code for session...");
    const {
      data: { session },
      error: sessionError,
    } = await supabaseForSession.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("❌ Session exchange error:", sessionError);
      console.log("🔍 Error message for debugging:", JSON.stringify(sessionError.message));
      console.log("🔍 Full error object:", JSON.stringify(sessionError));
      
      // Check if this might be a password reset code that was incorrectly routed here
      const errorMessage = sessionError.message || '';
      const isPasswordResetCode = errorMessage.includes('invalid request') || 
                                  errorMessage.includes('code verifier') ||
                                  errorMessage.includes('both auth code and code verifier should be non-empty') ||
                                  errorMessage.includes('validation_failed');
      
      console.log("🔍 Is password reset code?", isPasswordResetCode);
      
      if (isPasswordResetCode) {
        console.log("🔄 Session exchange failed - likely password reset code, redirecting to reset-password");
        return NextResponse.redirect(
          `${requestUrl.origin}/reset-password?code=${code}`,
        );
      }
      
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

    // Ensure user is linked to an account using service client
    const { id: userId, email } = session.user;
    const { data: accountLinks, error: accountLinksError } = await supabaseService
      .from("account_users")
      .select("account_id")
      .eq("user_id", userId);

    let isNewUser = false;
    if (!accountLinks || accountLinks.length === 0) {
      isNewUser = true;
      console.log("🆕 Creating new account for user:", userId);
      
      // Check if account already exists
      console.log("🔍 Checking if account already exists for user:", userId);
      const { data: existingAccount, error: accountCheckError } = await supabaseService
        .from("accounts")
        .select("id")
        .eq("id", userId)
        .single();

      if (accountCheckError) {
        console.error("❌ Error checking existing account:", accountCheckError);
        // Continue with account creation even if check fails
      }

      if (!existingAccount) {
        console.log("🆕 Creating new account for user:", userId);
        // Create account with proper fields
        const { data: newAccount, error: createAccountError } = await supabaseService
          .from("accounts")
          .insert({
            id: userId,
            user_id: userId, // This field exists in the schema
            email: email,
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            is_free_account: false,
            custom_prompt_page_count: 0,
            contact_count: 0,
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            plan: 'grower', // Use proper plan value instead of 'NULL'
            has_had_paid_plan: false,
            review_notifications_enabled: true
          })
          .select()
          .single();

        if (!createAccountError && newAccount) {
          console.log("✅ Account created successfully");
          await supabaseService
            .from("account_users")
            .insert([
              {
                account_id: userId,
                user_id: userId,
                role: "owner",
              },
            ]);
          console.log("✅ User linked to account as owner");
        } else {
          console.error("❌ Error creating account:", createAccountError);
        }
      } else {
        console.log("✅ Account already exists for user");
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

    // Redirect new users to create-business page to show welcome popup
    // Existing users go to dashboard
    const redirectUrl = isNewUser 
      ? `${requestUrl.origin}/dashboard/create-business`
      : `${requestUrl.origin}/dashboard`;
    
    console.log("✅ Redirecting to:", redirectUrl);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ Error in callback:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`,
    );
  }
}
