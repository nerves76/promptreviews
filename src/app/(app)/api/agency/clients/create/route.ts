/**
 * Agency Client Create API Route
 *
 * POST - Create a new client workspace managed by the agency
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const body = await request.json();
    const { business_name, contact_email, plan } = body;

    if (!business_name?.trim()) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans = ['grower', 'builder', 'maven'];
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Please select a valid plan (grower, builder, or maven)' },
        { status: 400 }
      );
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const agencyAccountId = await getRequestAccountId(request, user.id, supabase);

    if (!agencyAccountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify this is an agency account and user is owner
    const { data: agencyAccount, error: agencyError } = await supabase
      .from('accounts')
      .select('id, is_agncy, business_name')
      .eq('id', agencyAccountId)
      .single();

    if (agencyError || !agencyAccount) {
      return NextResponse.json(
        { error: 'Agency account not found' },
        { status: 404 }
      );
    }

    if (!agencyAccount.is_agncy) {
      return NextResponse.json(
        { error: 'This account is not an agency' },
        { status: 403 }
      );
    }

    // Verify user is owner of agency
    const { data: agencyUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', agencyAccountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !agencyUser || agencyUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only agency owners can create client workspaces' },
        { status: 403 }
      );
    }

    // Create the new client account with 14-day trial
    // Note: trial_ends_at omitted due to PostgREST schema cache delay after migration
    // Trial period can be calculated from created_at + 14 days
    const { data: newAccount, error: createError } = await supabaseAdmin
      .from('accounts')
      .insert({
        business_name: business_name.trim(),
        email: contact_email?.trim() || null,
        managing_agncy_id: agencyAccountId,
        plan: plan,
        subscription_status: 'trialing',
        is_agncy: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating client account:', createError);
      return NextResponse.json(
        { error: 'Failed to create client workspace' },
        { status: 500 }
      );
    }

    // Add the agency owner as an agency_manager on the client account
    const { error: accessError } = await supabaseAdmin
      .from('account_users')
      .insert({
        account_id: newAccount.id,
        user_id: user.id,
        role: 'owner', // Agency owner gets owner role on client account
      });

    if (accessError) {
      console.error('Error adding agency user to client account:', accessError);
      // Don't fail - the account was created, just log the error
    }

    // Create agency client access record
    const { error: agencyAccessError } = await supabaseAdmin
      .from('agncy_client_access')
      .insert({
        agency_account_id: agencyAccountId,
        client_account_id: newAccount.id,
        user_id: user.id,
        role: 'manager',
        status: 'active',
        accepted_at: new Date().toISOString(),
      });

    if (agencyAccessError) {
      console.error('Error creating agency access record:', agencyAccessError);
    }

    // Log the event
    await supabaseAdmin.from('account_events').insert({
      account_id: newAccount.id,
      event_type: 'account_created_by_agency',
      event_data: {
        agency_account_id: agencyAccountId,
        agency_name: agencyAccount.business_name,
        created_by: user.id,
        plan: plan,
        trial_ends_at: trialEndsAt.toISOString(),
      },
    });

    return NextResponse.json({
      message: 'Client workspace created with 14-day trial',
      client: {
        id: newAccount.id,
        business_name: newAccount.business_name,
        plan: plan,
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Agency client create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
