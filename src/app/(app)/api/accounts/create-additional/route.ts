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
      plan: 'no_plan', // Start with no plan - they need to choose one
      trial_start: null, // No trial dates
      trial_end: null, // No trial dates
      is_free_account: false, // Not a free account
      has_had_paid_plan: false, // Keep as false - we'll use is_additional_account instead
      is_additional_account: true, // Mark as additional account to prevent free trial
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
      onboarding_step: 'business_creation' // Start with business creation step
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
          trial_start: null, // No trial dates
          trial_end: null, // No trial dates
          is_free_account: false, // Not a free account
          has_had_paid_plan: false, // Keep as false - we'll use is_additional_account instead
          is_additional_account: true, // Mark as additional account to prevent free trial
          plan: 'no_plan', // Start with no plan - they need to choose one
          onboarding_step: 'business_creation' // Start with business creation step
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

    // Don't create a business automatically - user needs to go through create-business flow
    // This ensures they set up their business properly and choose a payment plan

    // FORCE update the account to ensure proper settings for additional accounts
    // Do this as a final step to override any trigger defaults
    const { error: finalUpdateError } = await serviceSupabase
      .from('accounts')
      .update({
        trial_start: null, // No trial dates
        trial_end: null, // No trial dates
        plan: 'no_plan', // No plan - they need to choose one
        is_free_account: false,
        has_had_paid_plan: false, // Keep as false
        is_additional_account: true, // Mark as additional account
        onboarding_step: 'business_creation' // Need to create business
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
        
    }


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