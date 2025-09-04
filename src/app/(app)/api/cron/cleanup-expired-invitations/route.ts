/**
 * Cron Job: Cleanup Expired Invitations
 * 
 * This endpoint automatically cleans up expired invitations to keep the database
 * clean and improve query performance. Should be called daily via cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceRoleClient();

    // Verify cron job authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }


    // Get expired invitations (older than 7 days and not accepted)
    const { data: expiredInvitations, error: selectError } = await supabaseAdmin
      .from('account_invitations')
      .select('id, email, account_id, expires_at, created_at')
      .lt('expires_at', new Date().toISOString())
      .is('accepted_at', null);

    if (selectError) {
      console.error('Error fetching expired invitations:', selectError);
      return NextResponse.json(
        { error: 'Failed to fetch expired invitations' },
        { status: 500 }
      );
    }

    if (!expiredInvitations || expiredInvitations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired invitations found',
        deleted_count: 0
      });
    }


    // Delete expired invitations
    const { error: deleteError } = await supabaseAdmin
      .from('account_invitations')
      .delete()
      .in('id', expiredInvitations.map(inv => inv.id));

    if (deleteError) {
      console.error('Error deleting expired invitations:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete expired invitations' },
        { status: 500 }
      );
    }


    // Log summary for monitoring
    const cleanupSummary = {
      deleted_count: expiredInvitations.length,
      oldest_invitation: expiredInvitations.reduce((oldest, inv) => 
        new Date(inv.created_at) < new Date(oldest.created_at) ? inv : oldest
      ),
      accounts_affected: [...new Set(expiredInvitations.map(inv => inv.account_id))].length
    };


    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${expiredInvitations.length} expired invitations`,
      ...cleanupSummary
    });

  } catch (error) {
    console.error('Expired invitations cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error during cleanup' },
      { status: 500 }
    );
  }
}

// Allow GET for health checks
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceRoleClient();
    
    // Count expired invitations without deleting
    const { count, error } = await supabaseAdmin
      .from('account_invitations')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString())
      .is('accepted_at', null);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to count expired invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      expired_invitations_count: count || 0,
      last_check: new Date().toISOString()
    });

  } catch (error) {
    console.error('Expired invitations check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 