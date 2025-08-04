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
    const supabase = createServiceRoleClient();

    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*');

    if (error) {
      console.error('[BUSINESSES] Error fetching businesses:', error);
      return NextResponse.json(
        { error: "Failed to fetch businesses" },
        { status: 500 }
      );
    }

    return NextResponse.json(businesses || []);
  } catch (error) {
    console.error('[BUSINESSES] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
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
      updated_at: new Date().toISOString(), // 🔧 FIX: Set updated_at to current time to prevent validation loop
    };

    const { data: business, error } = await supabase
      .from('businesses')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('[BUSINESSES] Error creating business:', error);
      
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
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('[BUSINESSES] Business created successfully:', business.id);

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

    return NextResponse.json(business);
  } catch (error) {
    console.error('[BUSINESSES] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 