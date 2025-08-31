/**
 * Create Additional Account API Route
 * 
 * This endpoint allows existing users to create additional accounts
 * for demos, client management, etc. Restricted to admin emails.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { canCreateAccounts } from '@/config/adminConfig';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has permission to create accounts
    if (!canCreateAccounts(user.email || '')) {
      return NextResponse.json(
        { error: "Permission denied. This feature is restricted to authorized users." },
        { status: 403 }
      );
    }

    const requestData = await request.json();
    console.log('Create additional account request:', JSON.stringify(requestData, null, 2));
    
    const { firstName, lastName, email, businessName } = requestData;

    if (!firstName || !lastName || !email || !businessName) {
      return NextResponse.json(
        { error: "First name, last name, email, and business name are required" },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceRoleClient();
    
    // Create a new auth user for this additional account
    // We'll use a modified email to ensure uniqueness in auth.users
    // but store the real email in the accounts table
    const timestamp = Date.now();
    const modifiedEmail = `${email.split('@')[0]}+${timestamp}@${email.split('@')[1]}`;
    
    const { data: newAuthUser, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: modifiedEmail,
      email_confirm: true, // Auto-confirm since this is an additional account
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        original_email: email,
        is_additional_account: true,
        created_by_user_id: user.id
      }
    });

    if (authError || !newAuthUser.user) {
      console.error('❌ Error creating auth user for additional account:', authError);
      return NextResponse.json(
        { error: "Failed to create additional account" },
        { status: 500 }
      );
    }
    
    const newAccountId = newAuthUser.user.id; // Use the new auth user's ID as account ID
    
    // Create new account record
    const accountData = {
      id: newAccountId, // This now matches an auth.users.id
      user_id: user.id, // Track who created this account
      plan: 'grower', // Start with grower plan
      trial_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // Trial started 15 days ago
      trial_end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Trial ended yesterday
      is_free_account: false, // Not a free account - they need to pay
      has_had_paid_plan: false, // Haven't had paid plan (won't trigger welcome back with no_plan)
      custom_prompt_page_count: 0,
      contact_count: 0,
      created_at: new Date().toISOString(),
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      business_name: businessName,
      review_notifications_enabled: true,
      email_review_notifications: true,
      gbp_insights_enabled: true,
      onboarding_step: 'complete' // Use onboarding_step instead of onboarding_completed
    };

    // Check if account already exists (created by trigger)
    const { data: existingAccount, error: checkError } = await serviceSupabase
      .from('accounts')
      .select('*')
      .eq('id', newAccountId)
      .single();

    let insertedAccount = existingAccount;

    if (!existingAccount) {
      // Account doesn't exist, create it
      const { data: newAccount, error: accountError } = await serviceSupabase
        .from('accounts')
        .insert(accountData)
        .select()
        .single();

      if (accountError) {
        console.error('❌ Error creating additional account:', JSON.stringify(accountError, null, 2));
        console.error('Account data attempted:', JSON.stringify(accountData, null, 2));
        return NextResponse.json(
          { error: "Failed to create account" },
          { status: 500 }
        );
      }
      insertedAccount = newAccount;
    } else {
      // Account exists (created by trigger), update it with our data
      const { data: updatedAccount, error: updateError } = await serviceSupabase
        .from('accounts')
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          business_name: businessName,
          user_id: user.id, // Track who created this additional account
          trial_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // Trial started 15 days ago
          trial_end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Trial ended yesterday
          is_free_account: false, // Not a free account - they need to pay
          has_had_paid_plan: false, // Haven't had paid plan (won't trigger welcome back with no_plan)
          plan: 'grower', // Start with grower plan (but trial is expired)
          onboarding_step: 'complete' // Mark as complete to avoid onboarding flow
        })
        .eq('id', newAccountId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating account:', updateError);
        return NextResponse.json(
          { error: "Failed to update account settings" },
          { status: 500 }
        );
      } else {
        insertedAccount = updatedAccount;
      }
      console.log('✅ Account already existed (created by trigger), updated with our data');
      console.log('Updated account data:', JSON.stringify(updatedAccount, null, 2));
    }

    // Create account_users link for BOTH users
    // 1. Link the new auth user to their own account (required by trigger)
    const newUserLinkData = {
      account_id: newAccountId,
      user_id: newAccountId, // The new auth user owns their account
      role: 'owner',
      created_at: new Date().toISOString()
    };
    
    const { error: newUserLinkError } = await serviceSupabase
      .from('account_users')
      .insert(newUserLinkData);
      
    if (newUserLinkError) {
      console.error('❌ Error linking new user to account:', newUserLinkError);
    }
    
    // 2. Also link the current user so they can access this account
    const currentUserLinkData = {
      account_id: newAccountId,
      user_id: user.id, // Current user also has access
      role: 'owner',
      created_at: new Date().toISOString()
    };

    console.log('Creating account_users link for current user:', JSON.stringify(currentUserLinkData, null, 2));

    const { error: linkError } = await serviceSupabase
      .from('account_users')
      .insert(currentUserLinkData);

    if (linkError) {
      console.error('❌ Error linking user to additional account:', JSON.stringify(linkError, null, 2));
      return NextResponse.json(
        { error: "Failed to link account to user" },
        { status: 500 }
      );
    }

    // Create initial business profile for the new account
    const businessData = {
      account_id: newAccountId,
      name: businessName,
      business_name: businessName,
      contact_name: `${firstName} ${lastName}`,
      industry: 'Other',
      created_at: new Date().toISOString(),
      // Set some defaults
      primary_color: '#4F46E5',
      secondary_color: '#818CF8',
      background_color: '#FFFFFF',
      text_color: '#1F2937',
      primary_font: 'Inter',
      secondary_font: 'Inter',
      background_type: 'gradient',
      gradient_start: '#3B82F6',
      gradient_end: '#c026d3',
      card_bg: '#FFFFFF',
      card_text: '#1A1A1A',
      card_transparency: 1.0,
      card_inner_shadow: false,
      card_shadow_color: '#222222',
      card_shadow_intensity: 0.2,
      review_platforms: []
    };

    const { error: businessError } = await serviceSupabase
      .from('businesses')
      .insert(businessData);

    if (businessError) {
      console.error('❌ Error creating business profile:', businessError);
      // Don't fail the request - account is still created
    }

    // FORCE update the account to remove trial and ensure proper settings
    // Do this as a final step to override any trigger defaults
    const { error: finalUpdateError } = await serviceSupabase
      .from('accounts')
      .update({
        trial_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // Trial started 15 days ago
        trial_end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Trial ended yesterday
        plan: 'grower', // Start with grower plan (but trial is expired)
        is_free_account: false,
        has_had_paid_plan: false, // Haven't had paid plan (won't trigger welcome back with no_plan)
        onboarding_step: 'complete'
      })
      .eq('id', newAccountId);

    if (finalUpdateError) {
      console.error('⚠️ Warning: Could not remove trial from additional account:', finalUpdateError);
    } else {
      console.log('✅ Successfully removed trial and discounts from additional account');
      
      // Verify the final state
      const { data: finalAccount, error: verifyError } = await serviceSupabase
        .from('accounts')
        .select('id, plan, trial_start, trial_end, has_had_paid_plan, is_free_account')
        .eq('id', newAccountId)
        .single();
        
      console.log('📊 Final account state after all updates:', JSON.stringify(finalAccount, null, 2));
    }

    console.log('✅ Additional account created successfully:', {
      accountId: newAccountId,
      businessName: businessName,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      message: "Additional account created successfully",
      accountId: newAccountId,
      accountName: businessName
    });

  } catch (error) {
    console.error('❌ Create additional account exception:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}