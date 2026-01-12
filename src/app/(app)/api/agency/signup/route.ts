/**
 * Agency Signup API Route
 *
 * Creates a new agency account with agency-specific metadata.
 * Sets up 30-day agency trial period.
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { AgencyMetadata } from '@/auth/types/auth.types';

interface AgencySignupRequest {
  // Standard account fields
  first_name: string;
  last_name: string;
  email: string;
  business_name: string;
  // Agency metadata
  metadata: AgencyMetadata;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const body: AgencySignupRequest = await request.json();

    // Validate required fields
    if (!body.metadata?.agncy_type || !body.metadata?.agncy_employee_count ||
        !body.metadata?.agncy_expected_clients || !body.metadata?.agncy_multi_location_pct) {
      return NextResponse.json(
        { error: 'All agency metadata fields are required' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user already has an agency account
    const { data: existingAgency, error: checkError } = await supabase
      .from('accounts')
      .select('id')
      .eq('created_by', user.id)
      .eq('is_agncy', true)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing agency:', checkError);
      return NextResponse.json(
        { error: 'Failed to check for existing agency account' },
        { status: 500 }
      );
    }

    if (existingAgency) {
      return NextResponse.json(
        { error: 'User already has an agency account', account_id: existingAgency.id },
        { status: 400 }
      );
    }

    // Calculate 30-day agency trial end
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);

    // Create the agency account
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert({
        created_by: user.id,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email || user.email,
        business_name: body.business_name,
        // Agency fields
        is_agncy: true,
        agncy_trial_start: now.toISOString(),
        agncy_trial_end: trialEnd.toISOString(),
        agncy_type: body.metadata.agncy_type,
        agncy_employee_count: body.metadata.agncy_employee_count,
        agncy_expected_clients: body.metadata.agncy_expected_clients,
        agncy_multi_location_pct: body.metadata.agncy_multi_location_pct,
        // Standard defaults
        plan: 'no_plan',
        onboarding_step: 'incomplete',
        is_additional_account: true, // Not the user's primary account
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating agency account:', createError);
      return NextResponse.json(
        { error: 'Failed to create agency account', details: createError.message },
        { status: 500 }
      );
    }

    // Add user as owner of the new agency account
    const { error: linkError } = await supabase
      .from('account_users')
      .insert({
        account_id: newAccount.id,
        user_id: user.id,
        role: 'owner',
      });

    if (linkError) {
      console.error('Error linking user to agency account:', linkError);
      // Try to clean up the orphaned account
      await supabase.from('accounts').delete().eq('id', newAccount.id);
      return NextResponse.json(
        { error: 'Failed to link user to agency account' },
        { status: 500 }
      );
    }

    // Log the event
    await supabase.from('account_events').insert({
      account_id: newAccount.id,
      event_type: 'agency_created',
      event_data: {
        user_id: user.id,
        agncy_type: body.metadata.agncy_type,
        trial_end: trialEnd.toISOString(),
      },
    });

    return NextResponse.json({
      message: 'Agency account created successfully',
      account: {
        id: newAccount.id,
        business_name: newAccount.business_name,
        is_agncy: newAccount.is_agncy,
        agncy_trial_end: newAccount.agncy_trial_end,
        agncy_type: newAccount.agncy_type,
      },
      trial: {
        starts: now.toISOString(),
        ends: trialEnd.toISOString(),
        days_remaining: 30,
      },
    });
  } catch (error) {
    console.error('Agency signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
