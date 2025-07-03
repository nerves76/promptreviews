import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabaseClient';
import { sendWelcomeEmail } from "@/utils/resend-welcome";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  console.log('🔗 Auth callback triggered with URL:', request.url);
  console.log('📝 Code parameter:', code ? 'Present' : 'Missing');
  console.log('🔄 Next parameter:', next || 'None');

  if (!code) {
    console.log('❌ No code provided, redirecting to sign-in');
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=missing_code`);
  }

  try {
    const supabase = await createServerSupabaseClient();
    console.log('🔄 Exchanging code for session...');

    const { data: { user, session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.log('❌ Session exchange error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`);
    }

    if (!user || !session) {
      console.log('❌ No user or session after exchange');
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=exchange_failed`);
    }

    console.log('✅ Session exchange successful for user:', user.email);
    console.log('📧 Email confirmed at:', user.email_confirmed_at);

    // If there's a next parameter, redirect there (e.g., for password reset)
    if (next) {
      console.log('🔄 Redirecting to next page:', next);
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }

    // For sign-up/sign-in (no next parameter), handle account creation
    const { id: userId, email } = user;
    const { data: accountLinks, error: accountLinksError } = await supabase
      .from("account_users")
      .select("account_id")
      .eq("user_id", userId);

    let isNewUser = false;
    if (!accountLinks || accountLinks.length === 0) {
      isNewUser = true;
      console.log("🆕 Creating new account for user:", userId);
      
      // Check if account already exists
      const { data: existingAccount, error: accountCheckError } = await supabase
        .from("accounts")
        .select("id")
        .eq("id", userId)
        .single();

      if (!existingAccount) {
        console.log("🆕 Creating new account for user:", userId);
        // Create account with proper fields
        const { data: newAccount, error: createAccountError } = await supabase
          .from("accounts")
          .insert({
            id: userId,
            user_id: userId,
            email: email,
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            is_free_account: false,
            custom_prompt_page_count: 0,
            contact_count: 0,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            plan: 'grower',
            has_had_paid_plan: false,
            review_notifications_enabled: true
          })
          .select()
          .single();

        if (!createAccountError && newAccount) {
          console.log("✅ Account created successfully");
          await supabase
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
        let firstName = "there";
        if (user.user_metadata?.first_name) {
          firstName = user.user_metadata.first_name;
        } else if (email) {
          firstName = email.split("@")[0];
        }

        await sendWelcomeEmail(email, firstName);
        console.log("📧 Welcome email sent to:", email);
      } catch (emailError) {
        console.error("❌ Error sending welcome email:", emailError);
      }
    }

    // Wait for the session to be set
    console.log("⏳ Waiting for session to be set...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect new users to create-business page, existing users to dashboard
    const redirectUrl = isNewUser 
      ? `${requestUrl.origin}/dashboard/create-business`
      : `${requestUrl.origin}/dashboard`;
    
    console.log("✅ Redirecting to:", redirectUrl);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Unexpected error in auth callback:', error);
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=callback_error`);
  }
}
