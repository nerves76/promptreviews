/**
 * Invitation Tracking API Route
 * 
 * This endpoint handles tracking invitation events like opens and clicks.
 * Used for invitation analytics and engagement metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

export async function POST(request: NextRequest) {
  const supabaseAdmin = createServiceRoleClient();

  try {
    // Get request data
    const { invitation_token, event_type, event_data = {} } = await request.json();

    if (!invitation_token || !event_type) {
      return NextResponse.json(
        { error: 'Invitation token and event type are required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ['opened', 'clicked', 'accepted', 'expired'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Find invitation by token
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('account_invitations')
      .select('id, email, expires_at, accepted_at')
      .eq('token', invitation_token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Don't track events for already accepted invitations (except the acceptance event)
    if (invitation.accepted_at && event_type !== 'accepted') {
      return NextResponse.json(
        { message: 'Event ignored - invitation already accepted' },
        { status: 200 }
      );
    }

    // Get client info for tracking
    const userAgent = request.headers.get('user-agent');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || null;

    // Log the event
    const { data: eventId, error: logError } = await supabaseAdmin
      .rpc('log_invitation_event', {
        p_invitation_id: invitation.id,
        p_event_type: event_type,
        p_event_data: event_data,
        p_user_agent: userAgent,
        p_ip_address: ipAddress
      });

    if (logError) {
      console.error('Error logging invitation event:', logError);
      return NextResponse.json(
        { error: 'Failed to log event' },
        { status: 500 }
      );
    }

    console.log(`📊 Tracked invitation event: ${event_type} for ${invitation.email}`);

    return NextResponse.json({
      success: true,
      event_id: eventId,
      message: `Event '${event_type}' tracked successfully`
    });

  } catch (error) {
    console.error('Invitation tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for tracking pixel (email opens) and click redirects
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const event = url.searchParams.get('event') || 'opened';
  const redirectUrl = url.searchParams.get('redirect');

  if (!token) {
    // Return 1x1 transparent pixel even for invalid requests
    return new Response(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }

  // Track the event asynchronously (don't wait for response)
  const trackingPromise = fetch(request.url.replace('/track', '/track'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': request.headers.get('user-agent') || '',
      'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      'X-Real-IP': request.headers.get('x-real-ip') || ''
    },
    body: JSON.stringify({
      invitation_token: token,
      event_type: event,
      event_data: {
        referrer: request.headers.get('referer'),
        timestamp: new Date().toISOString()
      }
    })
  }).catch(err => {
    console.error('Background tracking failed:', err);
  });

  // If there's a redirect URL (click tracking), redirect to it
  if (redirectUrl && event === 'clicked') {
    try {
      const decodedRedirectUrl = decodeURIComponent(redirectUrl);
      console.log(`🔄 Redirecting after tracking click: ${decodedRedirectUrl}`);
      
      return NextResponse.redirect(decodedRedirectUrl, { status: 302 });
    } catch (error) {
      console.error('Invalid redirect URL:', redirectUrl, error);
      // Fall back to direct invitation accept page
      const fallbackUrl = `${url.origin}/team/accept?token=${token}`;
      return NextResponse.redirect(fallbackUrl, { status: 302 });
    }
  }

  // Return tracking pixel for opens or other events
  return new Response(
    Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
    {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
} 