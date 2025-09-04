/**
 * Admin Account Cleanup API
 * 
 * Handles 90-day retention policy for deleted accounts:
 * - GET: Returns count of accounts eligible for permanent deletion
 * - POST: Permanently deletes accounts older than 90 days
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/auth/providers/supabase';
import { deleteUserCompletely } from '@/utils/adminDelete';
import { isAdmin } from '@/auth/utils/admin';
import { checkRateLimit, adminRateLimiter } from '@/lib/rate-limit';

/**
 * GET - Get count of accounts eligible for permanent deletion
 */
export async function GET(request: NextRequest) {
  try {
    // Check rate limit first (strict limits for admin operations)
    const { allowed, remaining } = checkRateLimit(request, adminRateLimiter);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Admin operations are rate limited for security.' },
        { status: 429 }
      );
    }

    const supabase = createClient();

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check admin status
    const adminStatus = await isAdmin(session.user.id, supabase);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Get count of accounts eligible for deletion (90 days by default)
    const { data: countResult, error: countError } = await supabase
      .rpc('count_accounts_eligible_for_deletion', { retention_days: 90 });

    if (countError) {
      console.error('Error counting eligible accounts:', countError);
      return NextResponse.json({ error: 'Failed to count eligible accounts' }, { status: 500 });
    }

    // Get detailed list of eligible accounts for display
    const { data: accountsResult, error: accountsError } = await supabase
      .rpc('get_accounts_eligible_for_deletion', { retention_days: 90 });

    if (accountsError) {
      console.error('Error getting eligible accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to get eligible accounts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: countResult || 0,
      accounts: accountsResult || [],
      retentionDays: 90
    });

  } catch (error) {
    console.error('Account cleanup GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Permanently delete accounts older than 90 days
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit first (strict limits for admin operations)
    const { allowed, remaining } = checkRateLimit(request, adminRateLimiter);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Admin operations are rate limited for security.' },
        { status: 429 }
      );
    }

    const supabase = createClient();

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check admin status
    const adminStatus = await isAdmin(session.user.id, supabase);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Parse request body
    const { confirm, dryRun } = await request.json();

    if (!confirm && !dryRun) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    // Get accounts eligible for deletion
    const { data: eligibleAccounts, error: accountsError } = await supabase
      .rpc('get_accounts_eligible_for_deletion', { retention_days: 90 });

    if (accountsError) {
      console.error('Error getting eligible accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to get eligible accounts' }, { status: 500 });
    }

    if (!eligibleAccounts || eligibleAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts eligible for deletion',
        deleted: 0,
        accounts: []
      });
    }

    // If dry run, just return what would be deleted
    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: `Dry run: ${eligibleAccounts.length} accounts would be permanently deleted`,
        count: eligibleAccounts.length,
        accounts: eligibleAccounts.map((acc: any) => ({
          email: acc.email,
          deleted_at: acc.deleted_at,
          days_since_deletion: acc.days_since_deletion,
          business_count: acc.business_count,
          user_count: acc.user_count
        })),
        dryRun: true
      });
    }

    // Perform actual deletion
    const deletionResults = [];
    let successCount = 0;
    let errorCount = 0;

    for (const account of eligibleAccounts) {
      try {
        
        // Use the existing adminDelete utility to completely remove the user
        const deleteResult = await deleteUserCompletely(account.email);
        
        if (deleteResult.success) {
          successCount++;
          deletionResults.push({
            email: account.email,
            success: true,
            message: 'Account permanently deleted'
          });
        } else {
          errorCount++;
          deletionResults.push({
            email: account.email,
            success: false,
            message: deleteResult.message || 'Unknown error'
          });
        }
      } catch (deleteError) {
        console.error(`Error deleting account ${account.email}:`, deleteError);
        errorCount++;
        deletionResults.push({
          email: account.email,
          success: false,
          message: deleteError instanceof Error ? deleteError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      message: `Processed ${eligibleAccounts.length} accounts: ${successCount} deleted, ${errorCount} errors`,
      deleted: successCount,
      errors: errorCount,
      results: deletionResults
    });

  } catch (error) {
    console.error('Account cleanup POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 