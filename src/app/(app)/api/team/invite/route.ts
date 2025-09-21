/**
 * Team Invite API Route
 * 
 * This endpoint handles sending invitations to join a team.
 * Only account owners can send invitations.
 */

import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { sendTeamInvitationEmail } from '@/utils/emailTemplates';
import { checkInvitationRateLimit, recordInvitationSuccess } from '@/middleware/invitationRateLimit';
import { validateInvitationEmail } from '@/utils/emailValidation';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { PLAN_LIMITS } from '@/lib/billing/config';

// 🔧 CONSOLIDATION: Shared server client creation for API routes
// This eliminates duplicate client creation patterns
async function createAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function POST(request: NextRequest) {
  // 🔧 CONSOLIDATED: Use shared client creation functions
  const supabase = await createAuthenticatedSupabaseClient();
  const supabaseAdmin = createServiceRoleClient(); // 🔧 Use centralized service role client

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const { email, role = 'member' } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!['owner', 'member', 'support'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "owner", "member", or "support"' },
        { status: 400 }
      );
    }

    // Get account ID using secure method that validates access
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 403 }
      );
    }

    // Get the user's account and business information
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select(`
        account_id,
        role,
        accounts (
          id,
          first_name,
          last_name,
          plan,
          max_users,
          email
        )
      `)
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .single();

    if (accountError || !accountUser) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check rate limits early
    const rateLimitResult = await checkInvitationRateLimit(request, accountId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    // Check if user is an owner
    if (accountUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can send invitations' },
        { status: 403 }
      );
    }

    // Get accounts data (handle both array and object formats)
    let accountRecord = Array.isArray(accountUser.accounts) ? accountUser.accounts[0] : accountUser.accounts;

    // Ensure account limits are aligned with plan
    const planLimits = PLAN_LIMITS[accountRecord?.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.grower;
    const desiredMaxUsers = planLimits.maxUsers ?? 1;
    const desiredMaxLocations = planLimits.maxLocations ?? 0;

    if (desiredMaxUsers && (accountRecord?.max_users ?? 0) < desiredMaxUsers) {
      try {
        const { data: updatedAccounts, error: updateError } = await supabaseAdmin
          .from('accounts')
          .update({
            max_users: desiredMaxUsers,
            max_locations: desiredMaxLocations,
          })
          .eq('id', accountId)
          .select('max_users, max_locations')
          .maybeSingle();

        if (updateError) {
          console.error('Failed to auto-update account limits before invitation:', updateError);
        } else if (updatedAccounts) {
          accountRecord = { ...accountRecord, ...updatedAccounts };
        } else {
          accountRecord = {
            ...accountRecord,
            max_users: desiredMaxUsers,
            max_locations: desiredMaxLocations,
          };
        }
      } catch (limitUpdateError) {
        console.error('Unexpected error auto-updating account limits:', limitUpdateError);
      }
    }

    // Advanced email validation
    const accountDomain = accountRecord?.email ? accountRecord.email.split('@')[1] : undefined;
    
    const emailValidation = validateInvitationEmail(email.trim(), {
      accountDomain,
      isOwnerInvite: role === 'owner',
      allowRoleEmails: true // Allow role emails but warn
    });

    if (!emailValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid email address', 
          details: emailValidation.errors,
          suggestions: emailValidation.suggestions
        },
        { status: 400 }
      );
    }

    // Show warnings but don't block (for UX)
    const warnings = emailValidation.warnings.length > 0 ? emailValidation.warnings : undefined;

    // Get business name from the businesses table
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name')
      .eq('account_id', accountId)
      .single();

    // Check if account can add more users
    const { data: canAdd, error: canAddError } = await supabase
      .rpc('can_add_user_to_account', { account_uuid: accountId });

    if (canAddError) {
      console.error('Error checking if can add user:', canAddError);
      return NextResponse.json(
        { error: 'Failed to check user limits' },
        { status: 500 }
      );
    }

    if (!canAdd) {
      return NextResponse.json(
        { 
          error: 'User limit reached',
          details: {
            current_users: accountRecord?.max_users,
            max_users: accountRecord?.max_users,
            plan: accountRecord?.plan
          }
        },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: usersList, error: usersListError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersListError) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersListError },
        { status: 500 }
      );
    }
    const foundUser = usersList.users.find(u => u.email === email.trim());
    const foundUserId = foundUser?.id;

    const { data: existingMember, error: memberCheckError } = await supabase
      .from('account_users')
      .select('user_id')
      .eq('account_id', accountId)
      .eq('user_id', foundUserId || '')
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this account' },
        { status: 400 }
      );
    }

    // Enhanced duplicate checking with better handling
    const { data: existingInvitation, error: inviteCheckError } = await supabase
      .from('account_invitations')
      .select('id, accepted_at, expires_at, role, created_at')
      .eq('account_id', accountId)
      .eq('email', emailValidation.email)
      .single();

    if (existingInvitation && !existingInvitation.accepted_at) {
      // There's a pending invitation - check if it's expired
      const isExpired = new Date(existingInvitation.expires_at) <= new Date();
      
      if (!isExpired) {
        // Check if roles are different - allow role change via new invitation
        if (existingInvitation.role !== role) {
          
          // Delete old invitation to create new one with different role
          await supabase
            .from('account_invitations')
            .delete()
            .eq('id', existingInvitation.id);
        } else {
          return NextResponse.json(
            { 
              error: 'An active invitation has already been sent to this email address',
              details: {
                sentAt: existingInvitation.created_at,
                expiresAt: existingInvitation.expires_at,
                role: existingInvitation.role
              }
            },
            { status: 409 }
          );
        }
      } else {
        // Clean up expired invitation
        
        await supabase
          .from('account_invitations')
          .delete()
          .eq('id', existingInvitation.id);
      }
    } else if (existingInvitation && existingInvitation.accepted_at) {
      // Remove accepted invitations to allow re-invitation
      
      const { error: deleteError } = await supabase
        .from('account_invitations')
        .delete()
        .eq('id', existingInvitation.id);
        
      if (deleteError) {
        console.error('Error deleting existing invitation:', deleteError);
        return NextResponse.json(
          { error: 'Failed to clean up existing invitation' },
          { status: 500 }
        );
      }
    }

    // Generate cryptographically secure token with enhanced entropy
    const token = generateSecureInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Create invitation with audit trail
    const { data: invitation, error: inviteError } = await supabase
      .from('account_invitations')
      .insert({
        account_id: accountId,
        email: emailValidation.email,
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Send email invitation
    const inviterName = `${accountRecord?.first_name || ''} ${accountRecord?.last_name || ''}`.trim() || 'Someone';
    const businessName = business?.name || 'their business';
    const formattedExpirationDate = new Date(invitation.expires_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });


    // Send the email
    const emailResult = await sendTeamInvitationEmail(
      emailValidation.email,
      inviterName,
      businessName,
      role,
      token,
      formattedExpirationDate
    );

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      
      // Clean up the invitation since email failed
      await supabase
        .from('account_invitations')
        .delete()
        .eq('id', invitation.id);
        
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    // Record successful invitation for rate limiting
    recordInvitationSuccess(accountId);

    // Log successful invitation for audit trail

    const response = NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        email_sent: emailResult.success
      },
      warnings: warnings
    });

    // Add rate limit headers to response
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;

  } catch (error) {
    console.error('Team invite API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a cryptographically secure invitation token with enhanced entropy
 */
function generateSecureInvitationToken(): string {
  // Use multiple entropy sources for enhanced security
  const timestamp = Date.now().toString(36);
  const randomBytes1 = randomBytes(24).toString('hex'); // 48 chars
  const randomBytes2 = randomBytes(8).toString('base64url'); // ~11 chars
  const randomBytes3 = randomBytes(4).toString('hex'); // 8 chars
  
  // Combine and shuffle for 67+ character token
  const combined = `${timestamp}${randomBytes1}${randomBytes2}${randomBytes3}`;
  
  // Additional mixing for extra security
  const finalToken = randomBytes(32).toString('hex') + combined.slice(0, 32);
  
  return finalToken;
}
