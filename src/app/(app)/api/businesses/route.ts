/**
 * Businesses API Route
 * 
 * This endpoint handles business creation and retrieval
 * using the service key to bypass RLS policies for API operations
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const account_id = searchParams.get('account_id');

    // DEVELOPMENT MODE BYPASS - Return mock business data
    if (process.env.NODE_ENV === 'development' && account_id === '12345678-1234-5678-9abc-123456789012') {
      console.log('🔧 DEV MODE: Returning mock business data');
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

    let query = supabase.from('businesses').select('*');
    
    if (account_id) {
      console.log(`[BUSINESSES] GET: Fetching businesses for account: ${account_id}`);
      query = query.eq('account_id', account_id);
    } else {
      console.log('[BUSINESSES] GET: Fetching all businesses');
    }

    const { data: businesses, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[BUSINESSES] Error fetching businesses:', error);
      return NextResponse.json(
        { error: "Failed to fetch businesses", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[BUSINESSES] GET: Found ${businesses?.length || 0} businesses`);
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
    const businessData = await request.json();
    const { name, account_id } = businessData;

    if (!name || !account_id) {
      return NextResponse.json(
        { error: "Missing required fields: name and account_id" },
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

    console.log(`[BUSINESSES] Creating business: ${name} for account: ${account_id}`);

    const supabase = createServiceRoleClient();
    
    // First, verify the account exists OR create it if needed
    console.log(`[BUSINESSES] Verifying account exists: ${account_id}`);
    const { data: accountExists, error: accountCheckError } = await supabase
      .from('accounts')
      .select('id, plan, is_free_account')
      .eq('id', account_id)
      .single();
    
    if (accountCheckError) {
      console.error('[BUSINESSES] Account verification failed:', accountCheckError);
      console.error('[BUSINESSES] Account check error details:', {
        code: accountCheckError.code,
        message: accountCheckError.message,
        accountId: account_id
      });
      
      // If account doesn't exist, we need to create it first
      // This can happen when a new user signs up and immediately creates a business
      if (accountCheckError.code === 'PGRST116') {
        console.log('[BUSINESSES] Account not found, creating it for new user...');
        
        // Get user info to populate account fields
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(account_id);
        
        const { error: createAccountError } = await supabase
          .from('accounts')
          .insert({
            id: account_id,
            user_id: account_id, // For new signups, account_id = user_id
            email: userData?.user?.email || businessData.business_email,
            first_name: userData?.user?.user_metadata?.first_name || '',
            last_name: userData?.user?.user_metadata?.last_name || '',
            plan: 'no_plan', // New users start with no plan
            is_free_account: false,
            has_had_paid_plan: false,
            custom_prompt_page_count: 0,
            contact_count: 0,
            review_notifications_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (createAccountError) {
          console.error('[BUSINESSES] Failed to create account:', createAccountError);
          
          // If it's a unique constraint error, the account might already exist
          if (createAccountError.code === '23505') {
            console.log('[BUSINESSES] Account may already exist, continuing...');
          } else {
            return NextResponse.json(
              { 
                error: "Account does not exist and could not be created",
                details: createAccountError.message,
                accountId: account_id
              },
              { status: 400 }
            );
          }
        } else {
          console.log('[BUSINESSES] Account created successfully');
          
          // Create account_users link for owner
          const { error: linkError } = await supabase
            .from('account_users')
            .insert({
              account_id: account_id,
              user_id: account_id,
              role: 'owner',
              created_at: new Date().toISOString()
            });
          
          if (linkError && linkError.code !== '23505') {
            console.error('[BUSINESSES] Account user link error:', linkError);
          }
        }
      } else {
        return NextResponse.json(
          { 
            error: "Failed to verify account",
            details: accountCheckError.message,
            accountId: account_id
          },
          { status: 400 }
        );
      }
    } else {
      console.log('[BUSINESSES] Account verified:', accountExists);
    }
    
    // DEVELOPMENT MODE BYPASS - Use existing account
    let bypassAccountValidation = false;
    if (process.env.NODE_ENV === 'development' && account_id === '12345678-1234-5678-9abc-123456789012') {
      console.log('🔧 DEV MODE: Using existing development account for business creation');
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
      account_id,
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

    console.log('[BUSINESSES] Attempting to insert business with data:', JSON.stringify(insertData, null, 2));
    
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
        accountId: account_id
      });
      
      // In development mode, if it's a foreign key constraint error for our mock account,
      // try to continue anyway by creating with minimal data
      if (bypassAccountValidation && error.code === '23503' && error.message.includes('fk_businesses_account_id')) {
        console.log('🔧 DEV MODE: Foreign key constraint failed as expected, trying alternative approach...');
        
        // Try creating the business without the account_id constraint by using a different approach
        // Since we're using service role, let's try to create the account first in a minimal way
        try {
          // Create a minimal account record that satisfies the constraint
          const { error: minimalAccountError } = await supabase
            .from('accounts')
            .upsert([{
              id: account_id,
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
          
          console.log('🔧 DEV MODE: Minimal account created, retrying business creation...');
          
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
          
          console.log('🔧 DEV MODE: Business created successfully on retry');
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
          accountId: account_id
        },
        { status: 500 }
      );
    }

    console.log('[BUSINESSES] Business created successfully:', business.id);
    console.log('[BUSINESSES] Full business object:', JSON.stringify(business, null, 2));

    // 🔧 CRITICAL FIX: Update accounts.business_name and promotion_code for metadata templates
    console.log('[BUSINESSES] Updating accounts.business_name and promotion_code...');
    const accountUpdates: any = { business_name: name };
    
    // Add promotion code if provided
    if (businessData.promotion_code) {
      accountUpdates.promotion_code = businessData.promotion_code;
      console.log('[BUSINESSES] Adding promotion code to account:', businessData.promotion_code);
    }
    
    const { error: accountUpdateError } = await supabase
      .from('accounts')
      .update(accountUpdates)
      .eq('id', account_id);

    if (accountUpdateError) {
      console.error('[BUSINESSES] Warning: Failed to update account data:', accountUpdateError);
      // Don't fail the entire operation, just log the warning
    } else {
      console.log('[BUSINESSES] Successfully updated account data:', accountUpdates);
    }

    // Create universal prompt page (same logic as SimpleBusinessForm)
    try {
      console.log('[BUSINESSES] Creating universal prompt page...');
      
      // Check if universal prompt page already exists
      const { data: existingUniversal } = await supabase
        .from("prompt_pages")
        .select("id")
        .eq("account_id", account_id)
        .eq("is_universal", true)
        .single();
      
      if (existingUniversal) {
        console.log('[BUSINESSES] Universal prompt page already exists, skipping creation');
      } else {
        const { slugify } = await import('@/utils/slugify');
        const universalSlug = slugify("universal", Date.now().toString(36));
      
      const universalPromptPageData = {
        account_id: account_id,
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
      business: business 
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