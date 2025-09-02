/**
 * API endpoint to refresh user session and force re-check of email confirmation
 * This helps resolve issues where the client cache doesn't reflect the updated email confirmation status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🔄 Force refresh session and account data for user:', userId);

    // Force refresh the auth session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('Session refresh failed:', refreshError);
      return NextResponse.json({ 
        error: 'Session refresh failed',
        details: refreshError.message 
      }, { status: 500 });
    }

    // Get account ID for the user
    const accountId = await getRequestAccountId(request, userId, supabase);
    
    if (!accountId) {
      return NextResponse.json({ 
        error: 'No account found for user' 
      }, { status: 404 });
    }

    // Get fresh account data directly from database (bypass any caching)
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError) {
      console.error('Account data refresh failed:', accountError);
      return NextResponse.json({ 
        error: 'Account data refresh failed',
        details: accountError.message 
      }, { status: 500 });
    }

    console.log('✅ Session and account data refreshed successfully');
    console.log('✅ Current plan:', accountData?.plan);

    return NextResponse.json({ 
      success: true,
      message: 'Session and account data refreshed successfully',
      accountData: {
        plan: accountData?.plan,
        trial_end: accountData?.trial_end,
        is_free_account: accountData?.is_free_account
      }
    });

  } catch (error) {
    console.error('Force refresh error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 