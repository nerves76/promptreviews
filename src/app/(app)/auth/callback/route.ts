import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sendWelcomeEmail } from "@/utils/resend-welcome";
import { sendAdminNewUserNotification } from "@/utils/emailTemplates";
import { ensureAdminForEmail } from '@/auth/utils/admin';
import { createServiceRoleClient } from '@/auth/providers/supabase';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code') || requestUrl.searchParams.get('token');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type');
  
  // Check all URL parameters for debugging
  const allParams = Object.fromEntries(requestUrl.searchParams.entries());
  
  // Check hash fragment for error information (Supabase puts errors there for security)
  const hashFragment = requestUrl.hash;

  // Check if there's an error in the hash fragment
  if (hashFragment && hashFragment.includes('error=')) {
    const hashParams = new URLSearchParams(hashFragment.substring(1));
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');
    
    
    // Redirect with the error information
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=${error || 'auth_failed'}&error_code=${errorCode || ''}&error_description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // If no code, check if we already have a session (Supabase might have set it during redirect)
  if (!code) {
    
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
        // Continue with the normal flow using the existing session
        const user = session.user;
        const { id: userId, email } = user;
        
        // Jump to account creation logic
        
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
        
        // Return HTML with loading animation for smooth transition
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Redirecting...</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #f9fafb;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .loader {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 1rem;
                }
                .stars {
                  display: flex;
                  gap: 0.5rem;
                }
                .star {
                  font-size: 2rem;
                  animation: pulse 1.5s ease-in-out infinite;
                }
                .star:nth-child(1) { animation-delay: 0s; }
                .star:nth-child(2) { animation-delay: 0.15s; }
                .star:nth-child(3) { animation-delay: 0.3s; }
                .star:nth-child(4) { animation-delay: 0.45s; }
                .star:nth-child(5) { animation-delay: 0.6s; }
                @keyframes pulse {
                  0%, 100% { opacity: 0.3; transform: scale(0.8); }
                  50% { opacity: 1; transform: scale(1); }
                }
                .message {
                  color: #6b7280;
                  font-size: 0.875rem;
                }
              </style>
            </head>
            <body>
              <div class="loader">
                <div class="stars">
                  <span class="star">⭐</span>
                  <span class="star">⭐</span>
                  <span class="star">⭐</span>
                  <span class="star">⭐</span>
                  <span class="star">⭐</span>
                </div>
                <p class="message">${isNewUser ? 'Setting up your account...' : 'Loading your dashboard...'}</p>
              </div>
              <script>
                sessionStorage.setItem('auth-redirect-in-progress', 'true');
                setTimeout(() => {
                  window.location.href = '${redirectUrl}';
                }, 100);
              </script>
            </body>
          </html>
        `;
        
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
    }
    
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

    
    // For email confirmations, the code verifier might be stored in cookies
    // Look for any code verifier cookies
    const allCookies = cookieStore.getAll();
    let codeVerifier = null;
    
    // Find the code verifier cookie (it should contain 'code-verifier')
    for (const cookie of allCookies) {
      if (cookie.name.includes('code-verifier')) {
        codeVerifier = cookie.value;
        break;
      }
    }
    
    
    // Try to exchange the code
    // If we have a code verifier, use it; otherwise try without it
    let sessionData, sessionError;
    
    // Try without code verifier - Supabase handles PKCE internally
    const result = await supabase.auth.exchangeCodeForSession(code);
    sessionData = result.data;
    sessionError = result.error;
    
    if (sessionError) {
      
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
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=user_not_found`);
    }


    
    // Debug: Check what cookies are being set
    const { data: { session: debugSession } } = await supabase.auth.getSession();


    // If there's a next parameter, redirect there (e.g., for password reset)
    // Handle this IMMEDIATELY to avoid running through account creation logic
    if (next) {
      
      // For password reset, add the user email as a query parameter to help with verification
      const redirectUrl = new URL(`${requestUrl.origin}${next}`);
      redirectUrl.searchParams.set('email', user.email || '');
      redirectUrl.searchParams.set('verified', 'true');
      
      return NextResponse.redirect(redirectUrl.toString());
    }

    // For sign-up/sign-in (no next parameter), handle account creation
    const { id: userId, email } = user;
    
    // First, ensure the account exists (in case the trigger failed)
    try {
      
      // Check if account exists
      const { data: existingAccount, error: checkError } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Account doesn't exist, create it
        
        // Call the backup function to create account
        const { data: createResult, error: createError } = await supabase
          .rpc('create_account_for_user', { user_id: userId });
        
        if (createError) {
          console.error('❌ Failed to create account via RPC:', createError);
          
          // Try direct insert as last resort
          const { error: insertError } = await supabase
            .from('accounts')
            .insert({
              id: userId,
              user_id: userId,
              email: email || '',
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              plan: 'no_plan',
              trial_start: null,
              trial_end: null,
              is_free_account: false,
              custom_prompt_page_count: 0,
              contact_count: 0,
              review_notifications_enabled: true,
              created_by: userId,
            });
          
          if (insertError) {
            console.error('❌ Direct account creation also failed:', insertError);
          } else {
            console.log('✅ Account created via direct insert');
          }
        } else {
        }
      } else if (existingAccount) {
      }
    } catch (error) {
      console.error('❌ Error ensuring account exists:', error);
      // Don't fail the whole flow, continue anyway
    }
    
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
        
        // Accept the first valid invitation
        const invitation = pendingInvitations[0];
        
        // Check if account can add more users
        const { data: canAdd, error: canAddError } = await supabase
          .rpc('can_add_user_to_account', { account_uuid: invitation.account_id });

        if (!canAddError && canAdd) {
          // Add user to account (NO separate account creation for team members)

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
            const supabaseAdmin = createServiceRoleClient();
            const { error: fallbackError } = await supabaseAdmin
              .from('account_users')
              .insert({
                account_id: invitation.account_id,
                user_id: userId,
                role: invitation.role
              });

            if (!fallbackError) {
              // Mark invitation as accepted
              await supabase
                .from('account_invitations')
                .update({ accepted_at: new Date().toISOString() })
                .eq('token', invitation.token);

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
        
        // Create account with proper fields
        const { data: newAccount, error: createAccountError } = await supabase
          .from("accounts")
          .insert({
            id: userId,
            user_id: userId,
            email: email,
            trial_start: null,
            trial_end: null,
            is_free_account: false,
            custom_prompt_page_count: 0,
            contact_count: 0,
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            plan: 'no_plan',
            has_had_paid_plan: false,
            review_notifications_enabled: true,
            created_by: userId,
          })
          .select()
          .single();

        if (createAccountError) {
          console.error("❌ Error creating account:", createAccountError);
          
          // If it's a duplicate key error, the account already exists
          if (createAccountError.code === '23505') {
            isNewUser = false;
          } else {
            // For other errors, redirect to sign-in
            return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=account_creation_failed`);
          }
        } else if (newAccount) {
          
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
          }
        }
      } else {
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
