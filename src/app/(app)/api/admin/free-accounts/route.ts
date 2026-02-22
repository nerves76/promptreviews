/**
 * Admin Free Accounts API
 *
 * This endpoint handles the creation and management of free accounts with specific plan levels.
 * Only accessible to admin users.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isAdmin as checkIsAdmin } from '@/utils/admin';
import { withRateLimit, RateLimits } from '@/app/(app)/api/middleware/rate-limit';

const supabaseAdmin: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserInfo(request: NextRequest): Promise<{ userId?: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return {};
  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return { userId: user?.id };
}

async function postHandler(request: NextRequest) {
  try {
    const { userId } = await getUserInfo(request);
    if (!userId || !(await checkIsAdmin(userId, supabaseAdmin))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email, planLevel } = await request.json();

    if (!email || !planLevel) {
      return NextResponse.json({ error: 'Email and plan level are required' }, { status: 400 });
    }

    const validPlanLevels = ['grower', 'builder', 'maven'];
    if (!validPlanLevels.includes(planLevel)) {
      return NextResponse.json({ error: 'Invalid plan level' }, { status: 400 });
    }

    const { data: existingAccount, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, is_free_account, free_plan_level')
      .eq('email', email)
      .maybeSingle();

    if (accountError) {
      console.error('Error checking existing account:', accountError);
      return NextResponse.json({ error: 'Failed to check existing account' }, { status: 500 });
    }

    if (existingAccount) {
      const { error: updateError } = await supabaseAdmin
        .from('accounts')
        .update({
          is_free_account: true,
          free_plan_level: planLevel,
          plan: planLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id);

      if (updateError) {
        console.error('Error updating free account:', updateError);
        return NextResponse.json({ error: 'Failed to update free account' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Updated existing free account ${email} to ${planLevel} level`,
      });
    }

    const { data: newAccount, error: createError } = await supabaseAdmin
      .from('accounts')
      .insert([{ email, is_free_account: true, free_plan_level: planLevel, plan: planLevel }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating free account:', createError);
      return NextResponse.json({ error: 'Failed to create free account' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Created free ${planLevel} account for ${email}`,
      account: newAccount,
    });
  } catch (error) {
    console.error('Error in free accounts POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getHandler(request: NextRequest) {
  try {
    const { userId } = await getUserInfo(request);
    if (!userId || !(await checkIsAdmin(userId, supabaseAdmin))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: freeAccounts, error: fetchError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, first_name, last_name, plan, free_plan_level, created_at, is_free_account')
      .eq('is_free_account', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching free accounts:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch free accounts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      accounts: freeAccounts || [],
    });
  } catch (error) {
    console.error('Error in free accounts GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler, RateLimits.adminStrict, getUserInfo);
export const GET = withRateLimit(getHandler, RateLimits.adminStrict, getUserInfo);