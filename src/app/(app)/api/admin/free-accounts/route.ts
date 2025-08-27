/**
 * Admin Free Accounts API
 * 
 * This endpoint handles the creation and management of free accounts with specific plan levels.
 * Only accessible to admin users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/auth/utils/admin';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the session and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isAdmin(user.id, supabaseAdmin);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const { email, planLevel } = await request.json();

    if (!email || !planLevel) {
      return NextResponse.json(
        { error: 'Email and plan level are required' },
        { status: 400 }
      );
    }

    // Validate plan level
    const validPlanLevels = ['grower', 'builder', 'maven'];
    if (!validPlanLevels.includes(planLevel)) {
      return NextResponse.json(
        { error: 'Invalid plan level' },
        { status: 400 }
      );
    }

    // Check if account already exists
    const { data: existingAccount, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, is_free_account, free_plan_level')
      .eq('email', email)
      .single();

    if (accountError && accountError.code !== 'PGRST116') {
      console.error('Error checking existing account:', accountError);
      return NextResponse.json(
        { error: 'Failed to check existing account' },
        { status: 500 }
      );
    }

    if (existingAccount) {
      if (existingAccount.is_free_account) {
        // Update existing free account's plan level
        const { error: updateError } = await supabaseAdmin
          .from('accounts')
          .update({
            free_plan_level: planLevel,
            plan: planLevel, // Also update the plan field
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAccount.id);

        if (updateError) {
          console.error('Error updating existing free account:', updateError);
          return NextResponse.json(
            { error: 'Failed to update existing free account' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Updated existing free account ${email} to ${planLevel} level`,
          account: {
            id: existingAccount.id,
            email: existingAccount.email,
            free_plan_level: planLevel,
            updated: true,
          },
        });
      } else {
        // Convert existing account to free account
        const { error: convertError } = await supabaseAdmin
          .from('accounts')
          .update({
            is_free_account: true,
            free_plan_level: planLevel,
            plan: planLevel, // Also update the plan field  
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAccount.id);

        if (convertError) {
          console.error('Error converting account to free:', convertError);
          return NextResponse.json(
            { error: 'Failed to convert account to free' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Converted existing account ${email} to free ${planLevel} account`,
          account: {
            id: existingAccount.id,
            email: existingAccount.email,
            free_plan_level: planLevel,
            converted: true,
          },
        });
      }
    }

    // Create new free account
    const { data: newAccount, error: createError } = await supabaseAdmin
      .from('accounts')
      .insert([{
        email: email,
        is_free_account: true,
        free_plan_level: planLevel,
        plan: planLevel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating free account:', createError);
      return NextResponse.json(
        { error: 'Failed to create free account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Created free ${planLevel} account for ${email}`,
      account: {
        id: newAccount.id,
        email: newAccount.email,
        free_plan_level: planLevel,
        created: true,
      },
    });

  } catch (error) {
    console.error('Error in free accounts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the session and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isAdmin(user.id, supabaseAdmin);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all free accounts
    const { data: freeAccounts, error: fetchError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, first_name, last_name, plan, free_plan_level, created_at, is_free_account')
      .eq('is_free_account', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching free accounts:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch free accounts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      accounts: freeAccounts || [],
    });

  } catch (error) {
    console.error('Error in free accounts GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 