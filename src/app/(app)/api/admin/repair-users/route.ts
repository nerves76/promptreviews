/**
 * Repair Users API Route
 * 
 * This route allows admins to check and repair broken user-account relationships
 * that are causing authentication issues like "Database error granting user".
 * 
 * It checks for users in the auth table who are missing corresponding rows
 * in the accounts and account_users tables, and optionally creates them.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/auth/utils/admin';
import { checkRateLimit, adminRateLimiter } from '@/lib/rate-limit';

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

    // Check admin privileges
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { email, repair = false, checkAll = false } = await request.json();

    // Validate input
    if (!checkAll && !email) {
      return NextResponse.json(
        { error: 'Either email or checkAll must be provided' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let results = {
      checked: 0,
      broken: 0,
      repaired: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    if (checkAll) {
      // Get all users from auth table
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        return NextResponse.json(
          { error: `Failed to fetch users: ${usersError.message}` },
          { status: 500 }
        );
      }

      results.checked = users.users.length;

      // Check each user
      for (const user of users.users) {
        const userResult = await checkAndRepairUser(supabaseAdmin, user, repair);
        if (userResult.broken) results.broken++;
        if (userResult.repaired) results.repaired++;
        if (userResult.error) results.errors.push(userResult.error);
        results.details.push(userResult);
      }
    } else {
      // Check specific user by email
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        return NextResponse.json(
          { error: `Failed to fetch users: ${userError.message}` },
          { status: 500 }
        );
      }

      const user = userData.users.find(u => u.email === email);
      if (!user) {
        return NextResponse.json(
          { error: `User with email ${email} not found` },
          { status: 404 }
        );
      }

      results.checked = 1;
      const userResult = await checkAndRepairUser(supabaseAdmin, user, repair);
      if (userResult.broken) results.broken++;
      if (userResult.repaired) results.repaired++;
      if (userResult.error) results.errors.push(userResult.error);
      results.details.push(userResult);
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.checked} users. Found ${results.broken} broken relationships${repair ? `, repaired ${results.repaired}` : ''}.`,
      results
    });

  } catch (error) {
    console.error('Repair users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check and optionally repair a single user's account relationships
 */
async function checkAndRepairUser(supabaseAdmin: any, user: any, repair: boolean) {
  const result = {
    userId: user.id,
    email: user.email,
    broken: false,
    repaired: false,
    error: null as string | null,
    issues: [] as string[],
    fixes: [] as string[]
  };

  try {
    // Check if user has an account
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();

    if (accountError && accountError.code !== 'PGRST116') {
      result.error = `Account check error: ${accountError.message}`;
      return result;
    }

    if (!accountData) {
      result.broken = true;
      result.issues.push('Missing account record');
      
      if (repair) {
        // Create account record
        const { error: createAccountError } = await supabaseAdmin
          .from('accounts')
          .insert({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createAccountError) {
          result.error = `Failed to create account: ${createAccountError.message}`;
        } else {
          result.repaired = true;
          result.fixes.push('Created account record');
        }
      }
    }

    // Check if user has account_users record
    const { data: accountUserData, error: accountUserError } = await supabaseAdmin
      .from('account_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (accountUserError && accountUserError.code !== 'PGRST116') {
      result.error = `Account user check error: ${accountUserError.message}`;
      return result;
    }

    if (!accountUserData) {
      result.broken = true;
      result.issues.push('Missing account_users record');
      
      if (repair) {
        // Create account_users record
        const { error: createAccountUserError } = await supabaseAdmin
          .from('account_users')
          .insert({
            account_id: user.id,
            user_id: user.id,
            role: 'owner',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createAccountUserError) {
          result.error = `Failed to create account_users record: ${createAccountUserError.message}`;
        } else {
          result.repaired = true;
          result.fixes.push('Created account_users record');
        }
      }
    }

  } catch (error: any) {
    result.error = `Unexpected error: ${error.message}`;
  }

  return result;
} 