/**
 * Test Admin Status API Endpoint
 *
 * Quick diagnostic endpoint to check admin status and debug issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/auth/providers/supabase';
import { isAdmin } from '@/utils/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        userError: userError?.message
      }, { status: 401 });
    }

    // Check admin status using the utility function
    const adminStatus = await isAdmin(user.id, supabase);

    // Also check directly in the database
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, email, is_admin, user_id')
      .eq('id', user.id)
      .maybeSingle();

    // Also try querying by user_id
    const { data: accountByUserId, error: userIdError } = await supabase
      .from('accounts')
      .select('id, email, is_admin, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      adminStatus: adminStatus,
      accountById: account || accountError,
      accountByUserId: accountByUserId || userIdError,
      diagnosis: {
        isAdmin: adminStatus,
        accountExists: !!account || !!accountByUserId,
        accountIdMatches: account?.id === user.id,
        userIdMatches: accountByUserId?.user_id === user.id,
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
