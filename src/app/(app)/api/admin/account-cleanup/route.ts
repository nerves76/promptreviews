/**
 * Admin Account Cleanup API
 *
 * Handles 90-day retention policy for deleted accounts:
 * - GET: Returns count of accounts eligible for permanent deletion
 * - POST: Permanently deletes accounts older than 90 days
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { deleteUserCompletely } from '@/utils/adminDelete';
import { isAdmin as checkIsAdmin } from '@/auth/utils/admin';
import { withRateLimit, RateLimits } from '@/app/(app)/api/middleware/rate-limit';

// Use service role client for admin operations
const supabaseAdmin: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserInfo(request: NextRequest): Promise<{ userId?: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {};
  }
  const token = authHeader.substring(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return { userId: user?.id };
}

async function getHandler(request: NextRequest) {
  try {
    const { userId } = await getUserInfo(request);
    if (!userId || !(await checkIsAdmin(userId, supabaseAdmin))) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { data: countResult, error: countError } = await supabaseAdmin
      .rpc('count_accounts_eligible_for_deletion', { retention_days: 90 });
    if (countError) {
      console.error('Error counting eligible accounts:', countError);
      return NextResponse.json({ error: 'Failed to count eligible accounts' }, { status: 500 });
    }

    const { data: accountsResult, error: accountsError } = await supabaseAdmin
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function postHandler(request: NextRequest) {
  try {
    const { userId } = await getUserInfo(request);
    if (!userId || !(await checkIsAdmin(userId, supabaseAdmin))) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { confirm, dryRun } = await request.json();
    if (!confirm && !dryRun) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    const { data: eligibleAccounts, error: accountsError } = await supabaseAdmin
      .rpc('get_accounts_eligible_for_deletion', { retention_days: 90 });
    if (accountsError) {
      console.error('Error getting eligible accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to get eligible accounts' }, { status: 500 });
    }

    if (!eligibleAccounts || eligibleAccounts.length === 0) {
      return NextResponse.json({ success: true, message: 'No accounts eligible for deletion', deleted: 0 });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: `Dry run: ${eligibleAccounts.length} accounts would be permanently deleted`,
        count: eligibleAccounts.length,
        accounts: eligibleAccounts.map((acc: any) => ({ email: acc.email, deleted_at: acc.deleted_at })),
        dryRun: true
      });
    }

    const deletionResults = [];
    let successCount = 0;
    let errorCount = 0;
    for (const account of eligibleAccounts) {
      try {
        const deleteResult = await deleteUserCompletely(account.email);
        if (deleteResult.success) {
          successCount++;
          deletionResults.push({ email: account.email, success: true, message: 'Account permanently deleted' });
        } else {
          errorCount++;
          deletionResults.push({ email: account.email, success: false, message: deleteResult.message || 'Unknown error' });
        }
      } catch (deleteError) {
        errorCount++;
        deletionResults.push({ email: account.email, success: false, message: deleteError instanceof Error ? deleteError.message : 'Unknown error' });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withRateLimit(getHandler, RateLimits.adminStrict, getUserInfo);
export const POST = withRateLimit(postHandler, RateLimits.adminStrict, getUserInfo);