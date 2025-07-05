import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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
    // Create server client with proper cookie handling (Next.js 15 async compatible)
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const value = cookieStore.get(name)?.value;
            return value;
          },
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    console.log('🔄 Exchanging code for session...');

    // Use the correct SSR method for code exchange
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.log('❌ Session exchange error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`);
    }

    console.log('✅ Code exchange successful');

    // Get the user after successful code exchange
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ No user found after code exchange:', userError);
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=user_not_found`);
    }

    console.log('✅ Session exchange successful for user:', user.email);
    console.log('📧 Email confirmed at:', user.email_confirmed_at);
    
    // Debug: Check what cookies are being set
    const { data: { session: debugSession } } = await supabase.auth.getSession();
    if (debugSession) {
      console.log('🍪 Session debug - Access token present:', !!debugSession.access_token);
      console.log('🍪 Session debug - Refresh token present:', !!debugSession.refresh_token);
      console.log('🍪 Session debug - Expires at:', debugSession.expires_at);
      console.log('🍪 Session debug - User ID in session:', debugSession.user?.id);
    } else {
      console.log('🍪 Session debug - No session found immediately after exchange');
    }

    // If there's a next parameter, redirect there (e.g., for password reset)
    // Handle this IMMEDIATELY to avoid running through account creation logic
    if (next) {
      console.log('🔄 Password reset or special flow detected, redirecting to:', next);
      console.log('🔄 Skipping account creation logic for this flow');
      
      // For password reset, add the user email as a query parameter to help with verification
      const redirectUrl = new URL(`${requestUrl.origin}${next}`);
      redirectUrl.searchParams.set('email', user.email || '');
      redirectUrl.searchParams.set('verified', 'true');
      
      console.log('🔗 Redirecting to:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl.toString());
    }

    // For sign-up/sign-in (no next parameter), handle account creation
    const { id: userId, email } = user;
    
    // Check if user already has account links
    const { data: accountLinks, error: accountLinksError } = await supabase
      .from("account_users")
      .select("account_id")
      .eq("user_id", userId);

    let isNewUser = false;
    
    if (accountLinksError) {
      console.error("❌ Error checking account links:", accountLinksError);
    }
    
    if (!accountLinks || accountLinks.length === 0) {
      isNewUser = true;
      console.log("🆕 User has no account links, checking for existing account...");
      
      // Check if account already exists (using user_id instead of id)
      const { data: existingAccount, error: accountCheckError } = await supabase
        .from("accounts")
        .select("id, user_id")
        .eq("user_id", userId)
        .single();

      if (accountCheckError && accountCheckError.code !== 'PGRST116') {
        console.error("❌ Error checking existing account:", accountCheckError);
      }

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
            plan: 'no_plan',
            has_had_paid_plan: false,
            review_notifications_enabled: true
          })
          .select()
          .single();

        if (createAccountError) {
          console.error("❌ Error creating account:", createAccountError);
          
          // If it's a duplicate key error, the account already exists
          if (createAccountError.code === '23505') {
            console.log("✅ Account already exists (duplicate key detected)");
            isNewUser = false;
          } else {
            // For other errors, redirect to sign-in
            return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=account_creation_failed`);
          }
        } else if (newAccount) {
          console.log("✅ Account created successfully");
          
          // Create account_user link with upsert to avoid duplicates
          const { error: linkError } = await supabase
            .from("account_users")
            .upsert([
              {
                account_id: userId,
                user_id: userId,
                role: "owner",
              },
            ], {
              onConflict: 'account_id,user_id'
            });
            
          if (linkError) {
            console.error("❌ Error creating account_user link:", linkError);
            // Don't fail the whole flow for this error
          } else {
            console.log("✅ User linked to account as owner");
          }
        }
      } else {
        console.log("✅ Account already exists for user");
        isNewUser = false;
        
        // Ensure account_user link exists with upsert
        if (existingAccount) {
          const { error: linkError } = await supabase
            .from("account_users")
            .upsert([
              {
                account_id: existingAccount.id,
                user_id: userId,
                role: "owner",
              },
            ], {
              onConflict: 'account_id,user_id'
            });
            
          if (linkError) {
            console.error("❌ Error ensuring account_user link:", linkError);
          } else {
            console.log("✅ Account_user link ensured");
          }
        }
      }
    } else {
      console.log("✅ User already has account links");
      isNewUser = false;
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
        // Don't fail the whole flow for email errors
      }
    }

    // Check for pending invitations for this user
    let hasAcceptedInvitation = false;
    try {
      const { data: pendingInvitations, error: invitationError } = await supabase
        .from('account_invitations')
        .select('token, account_id, role')
        .eq('email', email)
        .is('accepted_at', null)
        .gte('expires_at', new Date().toISOString());

      if (!invitationError && pendingInvitations && pendingInvitations.length > 0) {
        console.log('🎯 Found pending invitations for user:', pendingInvitations.length);
        
        // Accept the first valid invitation
        const invitation = pendingInvitations[0];
        
        // Check if account can add more users
        const { data: canAdd, error: canAddError } = await supabase
          .rpc('can_add_user_to_account', { account_uuid: invitation.account_id });

        if (!canAddError && canAdd) {
          // Add user to account
          const { error: addUserError } = await supabase
            .from('account_users')
            .insert({
              account_id: invitation.account_id,
              user_id: userId,
              role: invitation.role
            });

          if (!addUserError) {
            // Mark invitation as accepted
            await supabase
              .from('account_invitations')
              .update({ accepted_at: new Date().toISOString() })
              .eq('token', invitation.token);

            console.log('✅ Invitation accepted successfully');
            hasAcceptedInvitation = true;
          } else {
            console.error('❌ Error accepting invitation:', addUserError);
          }
        } else {
          console.error('❌ Cannot add user to account:', canAddError);
        }
      }
    } catch (invitationError) {
      console.error('❌ Error checking invitations:', invitationError);
    }

    // Redirect new users to create-business page, existing users to dashboard
    // If user accepted an invitation, redirect to dashboard instead of create-business
    const redirectUrl = (isNewUser && !hasAcceptedInvitation)
      ? `${requestUrl.origin}/dashboard/create-business`
      : `${requestUrl.origin}/dashboard`;
    
    console.log("✅ Redirecting to:", redirectUrl);
    
    // The cookies are automatically set by the createServerClient
    // Just redirect - the session will be available on the next request
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Unexpected error in auth callback:', error);
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=callback_error`);
  }
}
