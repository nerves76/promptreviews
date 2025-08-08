import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sendWelcomeEmail } from "@/utils/resend-welcome";
import { sendAdminNewUserNotification } from "@/utils/emailTemplates";
import { ensureAdminForEmail } from '@/utils/admin';
import { createServiceRoleClient } from '@/utils/supabaseClient';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code') || requestUrl.searchParams.get('token');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type');
  
  // Check hash fragment for error information (Supabase puts errors there for security)
  const hashFragment = requestUrl.hash;
  console.log('🔗 Auth callback triggered with URL:', request.url);
  console.log('📝 Code parameter:', code ? `Present (${code.substring(0, 10)}...)` : 'Missing');
  console.log('🔄 Next parameter:', next || 'None');
  console.log('📋 Type parameter:', type || 'None');
  console.log('#️⃣ Hash fragment:', hashFragment || 'None');

  // Check if there's an error in the hash fragment
  if (hashFragment && hashFragment.includes('error=')) {
    const hashParams = new URLSearchParams(hashFragment.substring(1));
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');
    
    console.log('❌ Error in hash fragment:', { error, errorCode, errorDescription });
    
    // Redirect with the error information
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=${error || 'auth_failed'}&error_code=${errorCode || ''}&error_description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // If no code, check if we already have a session (Supabase might have set it during redirect)
  if (!code) {
    console.log('⚠️ No code provided, checking for existing session...');
    
    try {
      // Create server client to check session
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
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session && session.user) {
        console.log('✅ Found existing session from Supabase redirect');
        // Continue with the normal flow using the existing session
        const user = session.user;
        const { id: userId, email } = user;
        
        // Jump to account creation logic
        console.log('🔄 Processing user with existing session:', userId);
        
        // Check for pending team invitations
        let hasAcceptedInvitation = false;
        try {
          const { data: pendingInvitations, error: invitationError } = await supabase
            .from('account_invitations')
            .select('token, account_id, role')
            .eq('email', email)
            .is('accepted_at', null)
            .gte('expires_at', new Date().toISOString());

          if (!invitationError && pendingInvitations && pendingInvitations.length > 0) {
            // Handle invitation logic (same as below)
            const invitation = pendingInvitations[0];
            const { data: canAdd } = await supabase
              .rpc('can_add_user_to_account', { account_uuid: invitation.account_id });

            if (canAdd) {
              const { error: addUserError } = await supabase
                .from('account_users')
                .insert({
                  account_id: invitation.account_id,
                  user_id: userId,
                  role: invitation.role
                });

              if (!addUserError) {
                await supabase
                  .from('account_invitations')
                  .update({ accepted_at: new Date().toISOString() })
                  .eq('token', invitation.token);
                
                return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error checking invitations:', error);
        }
        
        // Check if user has account
        const { data: accountLinks } = await supabase
          .from("account_users")
          .select("account_id")
          .eq("user_id", userId);
        
        const isNewUser = !accountLinks || accountLinks.length === 0;
        const redirectUrl = isNewUser 
          ? `${requestUrl.origin}/dashboard/create-business`
          : `${requestUrl.origin}/dashboard`;
        
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
    }
    
    console.log('❌ No code and no session found');
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
    
    // Try to exchange the code as a regular auth code first
    // This handles both OAuth codes and modern magic links
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.log('❌ Session exchange error:', sessionError);
      console.log('❌ Error details:', {
        message: sessionError.message,
        status: sessionError.status,
        code: sessionError.code
      });
      
      // If it's a token verification error, provide a more helpful message
      if (sessionError.message.includes('otp') || sessionError.message.includes('expired')) {
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/sign-in?error=link_expired&message=${encodeURIComponent('Your sign-in link has expired. Please request a new one.')}`
        );
      }
      
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(sessionError.message)}`);
    }


    // Get the user after successful code exchange
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ No user found after code exchange:', userError);
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=user_not_found`);
    }


    
    // Debug: Check what cookies are being set
    const { data: { session: debugSession } } = await supabase.auth.getSession();


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
    
    // 🔧 ENSURE ADMIN PRIVILEGES for admin emails
    if (email) {
      try {
        await ensureAdminForEmail({ id: userId, email }, supabase);

      } catch (adminError) {
        console.error('❌ Error checking admin privileges:', adminError);
        // Don't fail the flow for admin errors, just log them
      }
    }
    
    // PRIORITY 1: Check for pending team invitations FIRST
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
          // Add user to account (NO separate account creation for team members)
          console.log('🔧 Adding user to team account via callback:', {
            account_id: invitation.account_id,
            user_id: userId,
            role: invitation.role
          });

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


            hasAcceptedInvitation = true;
            
            // Skip individual account creation - team members use team account
            // Redirect directly to dashboard
            return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
          } else {
            console.error('❌ Error accepting invitation:', {
              error: addUserError,
              code: addUserError.code,
              message: addUserError.message,
              details: addUserError.details,
              hint: addUserError.hint,
              account_id: invitation.account_id,
              user_id: userId,
              role: invitation.role
            });

            // Try with service role client as fallback
            console.log('🔄 Attempting fallback with service role client in callback...');
            const supabaseAdmin = createServiceRoleClient();
            const { error: fallbackError } = await supabaseAdmin
              .from('account_users')
              .insert({
                account_id: invitation.account_id,
                user_id: userId,
                role: invitation.role
              });

            if (!fallbackError) {
              console.log('✅ Fallback succeeded - marking invitation as accepted');
              // Mark invitation as accepted
              await supabase
                .from('account_invitations')
                .update({ accepted_at: new Date().toISOString() })
                .eq('token', invitation.token);

              console.log('✅ Team invitation accepted via fallback - user added to team account');
              hasAcceptedInvitation = true;
              
              // Redirect to dashboard
              return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
            } else {
              console.error('❌ Fallback also failed in callback:', {
                error: fallbackError,
                code: fallbackError.code,
                message: fallbackError.message,
                details: fallbackError.details,
                hint: fallbackError.hint
              });
              
              // CRITICAL: For team invitations, don't fall back to individual account creation
              // Return error instead of continuing to individual account logic
              return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=team_invitation_failed&email=${encodeURIComponent(email || '')}`);
            }
          }
        } else {
          console.error('❌ Cannot add user to account:', canAddError || 'Account is full');
          // CRITICAL: For team invitations, don't fall back to individual account creation  
          // Return error instead of continuing to individual account logic
          return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=team_account_full&email=${encodeURIComponent(email || '')}`);
        }
      }
    } catch (invitationError) {
      console.error('❌ Error checking invitations:', invitationError);
      // If there's an error checking invitations, we can't be sure if there are pending invitations
      // For safety, only proceed to individual account creation if we explicitly confirm no invitations exist
      const { data: invitationCheck } = await supabase
        .from('account_invitations')
        .select('id')
        .eq('email', email)
        .is('accepted_at', null)
        .limit(1);
      
      if (invitationCheck && invitationCheck.length > 0) {
        console.error('❌ Team invitations exist but failed to process - preventing individual account creation');
        return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=invitation_processing_failed&email=${encodeURIComponent(email || '')}`);
      }
    }

    // PRIORITY 2: If no team invitation, handle individual account setup
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
        console.log("🆕 Creating new individual account for user:", userId);
        
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
          console.log("✅ Individual account created successfully");
          
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

    // Send welcome email for new individual users (not team members)
    if (isNewUser && email && !hasAcceptedInvitation) {
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

    // Send admin notification for new individual users (not team members)
    if (isNewUser && email && !hasAcceptedInvitation) {
      try {
        let firstName = "there";
        if (user.user_metadata?.first_name) {
          firstName = user.user_metadata.first_name;
        } else if (email) {
          firstName = email.split("@")[0];
        }

        let lastName = "";
        if (user.user_metadata?.last_name) {
          lastName = user.user_metadata.last_name;
        }

        await sendAdminNewUserNotification(email, firstName, lastName);
        console.log("📧 Admin notification sent for new user:", email);
      } catch (adminNotificationError) {
        console.error("❌ Error sending admin notification:", adminNotificationError);
        // Don't fail the whole flow for admin notification errors
      }
    }

    // Redirect new users to create-business page, existing users to dashboard
    // If user accepted an invitation, redirect to dashboard instead of create-business
    const redirectUrl = (isNewUser && !hasAcceptedInvitation)
      ? `${requestUrl.origin}/dashboard/create-business`
      : `${requestUrl.origin}/dashboard`;
    
    
    // The cookies are automatically set by the createServerClient
    // Just redirect - the session will be available on the next request
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Unexpected error in auth callback:', error);
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=callback_error`);
  }
}
