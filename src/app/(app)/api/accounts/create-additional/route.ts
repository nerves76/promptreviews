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

    const { businessName, businessEmail, industry } = await request.json();

    if (!businessName) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceRoleClient();
    
    // Generate new account ID
    const newAccountId = uuidv4();
    
    // Create new account record
    const accountData = {
      id: newAccountId,
      plan: 'no_plan',
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_free_account: false,
      custom_prompt_page_count: 0,
      contact_count: 0,
      created_at: new Date().toISOString(),
      first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || '',
      last_name: user.user_metadata?.last_name || '',
      email: businessEmail || user.email,
      review_notifications_enabled: true
    };

    const { error: accountError } = await serviceSupabase
      .from('accounts')
      .insert(accountData);

    if (accountError) {
      console.error('❌ Error creating additional account:', accountError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Create account_users link for the current user
    const { error: linkError } = await serviceSupabase
      .from('account_users')
      .insert({
        account_id: newAccountId,
        user_id: user.id,
        role: 'owner',
        created_at: new Date().toISOString()
      });

    if (linkError) {
      console.error('❌ Error linking user to additional account:', linkError);
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
      industry: industry || 'Other',
      created_at: new Date().toISOString(),
      // Set some defaults for demo purposes
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

    console.log('✅ Additional account created successfully:', {
      accountId: newAccountId,
      businessName,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      message: "Additional account created successfully",
      accountId: newAccountId,
      businessName
    });

  } catch (error) {
    console.error('❌ Create additional account exception:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}