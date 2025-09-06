/**
 * Businesses API Route
 * 
 * This endpoint handles business creation and retrieval
 * using the service key to bypass RLS policies for API operations
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/auth/providers/supabase";
import { verifyAccountAuth } from "../middleware/auth";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and get authorized account
    const authResult = await verifyAccountAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.errorCode || 401 }
      );
    }

    const { user, accountId } = authResult;
    if (!accountId) {
      return NextResponse.json(
        { error: "Account access required" },
        { status: 403 }
      );
    }

    // DEVELOPMENT MODE BYPASS - Return mock business data
    if (process.env.NODE_ENV === 'development' && accountId === '12345678-1234-5678-9abc-123456789012') {
      const mockBusiness = {
        id: '6762c76a-8677-4c7f-9a0f-f444024961a2',
        account_id: '12345678-1234-5678-9abc-123456789012',
        name: 'Chris Bolton',
        business_email: 'chris@diviner.agency',
        address_street: '2652 SE 89th Ave',
        address_city: 'Portland',
        address_state: 'Oregon',
        address_zip: '97266',
        address_country: 'United States',
        phone: '',
        business_website: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return NextResponse.json({ businesses: [mockBusiness] });
    }

    const supabase = createServiceRoleClient();

    // Always filter by the authenticated user's account - no client input trusted
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BUSINESSES] Error fetching businesses:', error);
      return NextResponse.json(
        { error: "Failed to fetch businesses", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ businesses: businesses || [] });
  } catch (error) {
    console.error('[BUSINESSES] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // For business creation, we need basic auth but account might not exist yet
    // This is typically called during initial setup after signup
    const { verifyAuth } = await import("../middleware/auth");
    
    console.log('[BUSINESSES] Starting auth verification...');
    const authResult = await verifyAuth(request);
    console.log('[BUSINESSES] Auth result:', {
      success: authResult.success,
      hasUser: !!authResult.user,
      error: authResult.error
    });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.errorCode || 401 }
      );
    }

    const { user } = authResult;
    
    // Log the user object for debugging
    console.log('[BUSINESSES] User from auth:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userKeys: user ? Object.keys(user) : 'user is null',
      userType: typeof user,
      userIdType: user ? typeof user.id : 'N/A'
    });
    
    // CRITICAL: Log each property explicitly to debug the issue
    if (user) {
      console.log('[BUSINESSES] User properties:');
      console.log('[BUSINESSES]   user.id =', user.id);
      console.log('[BUSINESSES]   user["id"] =', user["id"]);
      console.log('[BUSINESSES]   Object.hasOwnProperty(user, "id") =', Object.prototype.hasOwnProperty.call(user, "id"));
      console.log('[BUSINESSES]   "id" in user =', "id" in user);
      console.log('[BUSINESSES]   user keys =', Object.keys(user));
      console.log('[BUSINESSES]   user.email =', user.email);
      console.log('[BUSINESSES]   Full user stringified (first 500 chars):', JSON.stringify(user).substring(0, 500));
    } else {
      console.log('[BUSINESSES] User is null or undefined');
    }
    
    // Ensure user has an ID
    if (!user?.id) {
      console.error('[BUSINESSES] User object missing ID:', {
        user: user,
        userKeys: user ? Object.keys(user) : 'user is null',
        authResult: authResult
      });
      return NextResponse.json(
        { error: "Invalid user session - user ID not found" },
        { status: 401 }
      );
    }
    
    // Try to get account ID, but don't fail if it doesn't exist
    // The business creation will handle account creation if needed
    const { getRequestAccountId } = await import("@/app/(app)/api/utils/getRequestAccountId");
    let accountId = await getRequestAccountId(request, user.id);
    
    // If no account exists, we'll create one during business creation
    // This happens for new users creating their first business

    const businessData = await request.json();
    const { name } = businessData;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Validate promotion code if provided
    const VALID_PROMOTION_CODES = ["grower49-offer2025"];
    if (businessData.promotion_code && businessData.promotion_code.trim() !== "") {
      if (!VALID_PROMOTION_CODES.includes(businessData.promotion_code.trim())) {
        return NextResponse.json(
          { error: "Invalid promotion code. Please check your code and try again." },
          { status: 400 }
        );
      }
    }


    const supabase = createServiceRoleClient();
    
    // If no accountId, this is a user creating a new account/business
    // Create a new independent account with proper UUID
    if (!accountId) {
      console.log('[BUSINESSES] No account found for user, creating new independent account');
      
      // Generate a new UUID for the account (independent from user.id)
      const newAccountId = crypto.randomUUID();
      const { data: newAccountData, error: createAccountError } = await supabase
        .from('accounts')
        .insert({
          id: newAccountId, // Explicitly set the UUID
          user_id: user.id, // CRITICAL: Set user_id for the trigger
          email: user.email || businessData.business_email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          plan: 'no_plan', // New accounts start with no plan
          is_free_account: false,
          has_had_paid_plan: false,
          custom_prompt_page_count: 0,
          contact_count: 0,
          review_notifications_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (createAccountError) {
        console.error('[BUSINESSES] Failed to create account:');
        console.error('[BUSINESSES] Error object:', JSON.stringify(createAccountError, null, 2));
        console.error('[BUSINESSES] Insert data:', {
          id: newAccountId,
          email: user.email || businessData.business_email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || ''
        });
        return NextResponse.json(
          { 
            error: "Failed to create account",
            details: createAccountError.message,
            code: createAccountError.code,
            hint: createAccountError.hint
          },
          { status: 400 }
        );
      }
      
      // Use the newly created account ID
      accountId = newAccountData.id;
      console.log('[BUSINESSES] Created new account with ID:', accountId);
      
      // Create account_users link for owner
      // Double-check user.id exists before inserting
      if (!user?.id) {
        console.error('[BUSINESSES] Cannot create account_users link - user.id is null:', {
          user: user,
          accountId: accountId
        });
        return NextResponse.json(
          { 
            error: "User session invalid - cannot link account",
            details: "User ID is missing from session"
          },
          { status: 401 }
        );
      }
      
      console.log('[BUSINESSES] Creating account_users link:', {
        account_id: accountId,
        user_id: user.id,
        user_email: user.email,
        userType: typeof user.id,
        userIdValue: user.id
      });
      
      // Final validation before insert
      const userId = user?.id;
      if (!userId) {
        console.error('[BUSINESSES] CRITICAL: user.id is null right before insert!', {
          user: user,
          userKeys: user ? Object.keys(user) : 'null'
        });
        throw new Error('User ID is null at insert time');
      }
      
      console.log('[BUSINESSES] About to insert account_users with:', {
        account_id: accountId,
        user_id: userId,
        role: 'owner',
        userIdType: typeof userId,
        userIdLength: userId ? userId.length : 0
      });
      
      // Create the insert object and log it
      const insertData = {
        account_id: accountId,
        user_id: userId,  // Use the validated userId variable
        role: 'owner',
        created_at: new Date().toISOString()
      };
      
      console.log('[BUSINESSES] Insert data object:', JSON.stringify(insertData));
      console.log('[BUSINESSES] Verifying userId before insert:', userId);
      console.log('[BUSINESSES] Verifying accountId before insert:', accountId);
      
      const { error: linkError } = await supabase
        .from('account_users')
        .insert(insertData);
      
      if (linkError) {
        console.error('[BUSINESSES] Account user link error:', {
          error: linkError,
          code: linkError.code,
          message: linkError.message,
          details: linkError.details,
          accountId: accountId,
          userId: user.id
        });
        
        // Only ignore duplicate key errors (user already linked to account)
        if (linkError.code !== '23505') {
          return NextResponse.json(
            { 
              error: "Failed to link user to account",
              details: linkError.message
            },
            { status: 400 }
          );
        }
      }
    } else {
      // Verify the account exists if we have an accountId
      const { data: accountExists, error: accountCheckError } = await supabase
        .from('accounts')
        .select('id, plan, is_free_account')
        .eq('id', accountId)
        .single();
      
      if (accountCheckError) {
        console.error('[BUSINESSES] Account verification failed:', accountCheckError);
        return NextResponse.json(
          { 
            error: "Account not found or access denied",
            details: accountCheckError.message
          },
          { status: 403 }
        );
      }
    }
    
    // DEVELOPMENT MODE BYPASS - Use existing account
    let bypassAccountValidation = false;
    if (process.env.NODE_ENV === 'development' && accountId === '12345678-1234-5678-9abc-123456789012') {
      bypassAccountValidation = true;
    }

    // Convert industry string to array if it's a string
    let industryData = businessData.industry || null;
    if (industryData && typeof industryData === 'string') {
      industryData = [industryData];
    }

    // Prepare business data for insertion, including all fields from the form
    const insertData = {
      id: crypto.randomUUID(), // 🔧 FIXED: Generate UUID for ID until migration is applied
      name,
      account_id: accountId,
      industry: industryData,
      industries_other: businessData.industries_other || null,
      business_website: businessData.business_website || null,
      business_email: businessData.business_email || null,
      phone: businessData.phone || null,
      address_street: businessData.address_street || null,
      address_city: businessData.address_city || null,
      address_state: businessData.address_state || null,
      address_zip: businessData.address_zip || null,
      address_country: businessData.address_country || null,
      tagline: businessData.tagline || null,
      company_values: businessData.company_values || null,
      ai_dos: businessData.ai_dos || null,
      ai_donts: businessData.ai_donts || null,
      services_offered: businessData.services_offered || null,
      differentiators: businessData.differentiators || null,
      years_in_business: businessData.years_in_business || null,
      industries_served: businessData.industries_served || null,
      // Referral source tracking
      referral_source: businessData.referral_source || null,
      referral_source_other: businessData.referral_source_other || null,
      // Glassmorphic design defaults
      primary_font: 'Inter',
      secondary_font: 'Roboto',
      primary_color: '#2563EB',
      secondary_color: '#2563EB',
      background_type: 'gradient',
      background_color: '#FFFFFF',
      gradient_start: '#2563EB',
      gradient_middle: '#7864C8',
      gradient_end: '#914AAE',
      card_bg: '#FFFFFF',
      card_text: '#FFFFFF',
      card_placeholder_color: '#9CA3AF',
      card_transparency: 0.70, // Changed from 0.30 to meet database constraint (0.50-1.00)
      card_border_width: 1,
      card_border_color: '#FFFFFF',
      card_border_transparency: 0.5,
      card_inner_shadow: true,
      card_shadow_color: '#FFFFFF',
      card_shadow_intensity: 0.30,
      updated_at: new Date().toISOString(), // 🔧 FIX: Set updated_at to current time to prevent validation loop
    };

    
    const { data: business, error } = await supabase
      .from('businesses')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('[BUSINESSES] Error creating business:', error);
      console.error('[BUSINESSES] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        accountId: accountId
      });
      
      // In development mode, if it's a foreign key constraint error for our mock account,
      // try to continue anyway by creating with minimal data
      if (bypassAccountValidation && error.code === '23503' && error.message.includes('fk_businesses_account_id')) {
        
        // Try creating the business without the account_id constraint by using a different approach
        // Since we're using service role, let's try to create the account first in a minimal way
        try {
          // Create a minimal account record that satisfies the constraint
          const { error: minimalAccountError } = await supabase
            .from('accounts')
            .upsert([{
              id: accountId,
              plan: 'free',
              is_free_account: false,
              custom_prompt_page_count: 0,
              contact_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }], { onConflict: 'id' });
          
          if (minimalAccountError) {
            console.error('🔧 DEV MODE: Still cannot create account:', minimalAccountError);
            return NextResponse.json(
              { 
                error: "Failed to create business",
                details: `Development mode: Cannot bypass foreign key constraints. ${error.message}` 
              },
              { status: 500 }
            );
          }
          
          
          // Try business creation again
          const { data: retryBusiness, error: retryError } = await supabase
            .from('businesses')
            .insert([insertData])
            .select()
            .single();
          
          if (retryError) {
            console.error('🔧 DEV MODE: Business creation still failed:', retryError);
            return NextResponse.json(
              { 
                error: "Failed to create business",
                details: retryError.message 
              },
              { status: 500 }
            );
          }
          
          return NextResponse.json({ business: retryBusiness }, { status: 201 });
          
        } catch (devError) {
          console.error('🔧 DEV MODE: Alternative approach failed:', devError);
          return NextResponse.json(
            { 
              error: "Failed to create business",
              details: `Development bypass failed: ${error.message}` 
            },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create business",
          details: error.message,
          code: error.code,
          hint: error.hint,
          accountId: accountId
        },
        { status: 500 }
      );
    }


    // 🔧 CRITICAL FIX: Update accounts.business_name and promotion_code for metadata templates
    const accountUpdates: any = { business_name: name };
    
    // Add promotion code if provided
    if (businessData.promotion_code) {
      accountUpdates.promotion_code = businessData.promotion_code;
    }
    
    const { error: accountUpdateError } = await supabase
      .from('accounts')
      .update(accountUpdates)
      .eq('id', accountId);

    if (accountUpdateError) {
      console.error('[BUSINESSES] Warning: Failed to update account data:', accountUpdateError);
      // Don't fail the entire operation, just log the warning
    } else {
    }

    // Create universal prompt page (same logic as SimpleBusinessForm)
    try {
      
      // Check if universal prompt page already exists
      const { data: existingUniversal } = await supabase
        .from("prompt_pages")
        .select("id")
        .eq("account_id", accountId)
        .eq("is_universal", true)
        .single();
      
      if (existingUniversal) {
      } else {
        const { slugify } = await import('@/utils/slugify');
        const universalSlug = slugify("universal", Date.now().toString(36));
      
      const universalPromptPageData = {
        account_id: accountId,
        slug: universalSlug,
        is_universal: true,
        status: "draft",
        type: "universal",
        review_type: "service",
        offer_enabled: null,
        offer_title: null,
        offer_body: null,
        offer_url: null,
        emoji_sentiment_enabled: false,
        emoji_sentiment_question: "How was your experience?",
        emoji_feedback_message: "We value your feedback! Let us know how we can do better.",
        emoji_thank_you_message: "Thank you for your feedback!",
        ai_button_enabled: true,
        falling_icon: "star",
        review_platforms: [],
        services_offered: null,
        product_name: "",
        product_description: "",
        product_photo: "",
        product_subcopy: "",
        features_or_benefits: [],
        show_friendly_note: true,
        friendly_note: "",
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        role: "",
        category: "",
        client_name: "",
        location: "",
        project_type: "",
        outcomes: "",
        date_completed: null,
        assigned_team_members: "",
        qr_code_url: "",
        team_member: null,
        no_platform_review_template: "",
        video_max_length: null,
        video_quality: "",
        video_preset: "",
        video_questions: [],
        video_note: "",
        video_tips: "",
        video_recipient: ""
      };

        const { data: universalPage, error: universalError } = await supabase
          .from("prompt_pages")
          .insert([universalPromptPageData])
          .select()
          .single();

        if (universalError) {
          console.error('[BUSINESSES] Universal prompt page creation error:', universalError);
          console.warn('[BUSINESSES] Universal prompt page creation failed, but business was created successfully');
        } else {
          console.log('[BUSINESSES] Universal prompt page created successfully:', universalPage.id);
        }
      }
    } catch (universalErr) {
      console.error('[BUSINESSES] Error creating universal prompt page:', universalErr);
      console.warn('[BUSINESSES] Universal prompt page creation failed, but business was created successfully');
    }

    return NextResponse.json({ 
      success: true,
      business: business,
      accountId: accountId // Include account ID so frontend can update its state
    }, { status: 201 });
  } catch (error) {
    console.error('[BUSINESSES] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[BUSINESSES] Error stack:', errorStack);
    console.error('[BUSINESSES] Full error object:', JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        fullError: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 