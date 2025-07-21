/**
 * Team Invitation Resend API Route
 * 
 * This endpoint handles resending team invitations with updated expiration dates.
 * Only account owners can resend invitations.
 */

import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/utils/supabaseClient';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { sendTeamInvitationEmail } from '@/utils/emailTemplates';
import { checkInvitationRateLimit, recordInvitationSuccess } from '@/middleware/invitationRateLimit';

// 🔧 CONSOLIDATION: Shared server client creation for API routes
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
  const supabase = await createAuthenticatedSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    // Get the current user - try both cookie and header auth
    let user = null;
    let userError = null;

    // First try cookie-based auth
    const cookieResult = await supabase.auth.getUser();
    if (!cookieResult.error && cookieResult.data.user) {
      user = cookieResult.data.user;
    } else {
      // If cookie auth fails, try Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const headerResult = await supabaseAdmin.auth.getUser(token);
        if (!headerResult.error && headerResult.data.user) {
          user = headerResult.data.user;
        } else {
          userError = headerResult.error;
        }
      } else {
        userError = cookieResult.error;
      }
    }
    
    if (!user) {
      console.error('🔒 Resend API - Authentication failed:', {
        cookieError: cookieResult.error?.message,
        headerError: userError?.message,
        hasAuthHeader: !!request.headers.get('authorization')
      });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ Resend API - User authenticated:', {
      userId: user.id,
      email: user.email,
      authMethod: cookieResult.data.user ? 'cookie' : 'header'
    });

    // Get request body
    const { invitation_id } = await request.json();

    if (!invitation_id) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get the user's account
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('user_id', user.id)
      .single();

    if (accountError || !accountUser) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if user is an owner
    if (accountUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can resend invitations' },
        { status: 403 }
      );
    }

    // Check rate limits for resending invitations
    const rateLimitResult = await checkInvitationRateLimit(request, accountUser.account_id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    // Get the invitation to resend
    const { data: invitation, error: invitationError } = await supabase
      .from('account_invitations')
      .select('id, email, role, account_id, token, expires_at, accepted_at')
      .eq('id', invitation_id)
      .eq('account_id', accountUser.account_id)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation was already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Cannot resend an already accepted invitation' },
        { status: 400 }
      );
    }

    // Generate new secure token and extend expiration
    const newToken = generateSecureInvitationToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Update invitation with new token and expiration
    const { error: updateError } = await supabase
      .from('account_invitations')
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invitation' },
        { status: 500 }
      );
    }

    // Get account and business info for email
    const { data: account, error: accountInfoError } = await supabase
      .from('accounts')
      .select('first_name, last_name')
      .eq('id', accountUser.account_id)
      .single();

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('name')
      .eq('account_id', accountUser.account_id)
      .single();

    // Send the resent invitation email
    const inviterName = account ? `${account.first_name || ''} ${account.last_name || ''}`.trim() || 'Someone' : 'Someone';
    const businessName = business?.name || 'their business';
    const formattedExpirationDate = newExpiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });

    console.log('📧 Resending invitation email...', {
      to: invitation.email,
      from: inviterName,
      business: businessName,
      role: invitation.role,
      expires: formattedExpirationDate
    });

    // Send the email
    const emailResult = await sendTeamInvitationEmail(
      invitation.email,
      inviterName,
      businessName,
      invitation.role,
      newToken,
      formattedExpirationDate
    );

    if (!emailResult.success) {
      console.error('Failed to resend invitation email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to resend invitation email' },
        { status: 500 }
      );
    }

    // Record successful invitation resend for rate limiting
    recordInvitationSuccess(accountUser.account_id);

    // Log successful resend for audit trail
    console.log('✅ Invitation resent successfully', {
      invitationId: invitation.id,
      email: invitation.email,
      role: invitation.role,
      resentBy: user.id,
      accountId: accountUser.account_id
    });

    const response = NextResponse.json({
      message: 'Invitation resent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: newExpiresAt.toISOString(),
        email_sent: emailResult.success
      }
    });

    // Add rate limit headers to response
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;

  } catch (error) {
    console.error('Team invitation resend API error:', error);
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