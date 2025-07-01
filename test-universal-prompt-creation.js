/**
 * Test Universal Prompt Page Creation
 * 
 * This script tests the universal prompt page creation logic
 * that was added to the SimpleBusinessForm component.
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const APP_URL = 'http://localhost:3001';

// Import the slugify function
function slugify(text, uniquePart) {
  const baseSlug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (uniquePart) {
    return `${baseSlug}-${uniquePart}`;
  }
  return baseSlug;
}

// Add the mapToDbColumns function from CreatePromptPageClient
function mapToDbColumns(formData) {
  const insertData = { ...formData };
  insertData["emoji_sentiment_enabled"] = formData.emojiSentimentEnabled;
  insertData["emoji_sentiment_question"] = formData.emojiSentimentQuestion;
  insertData["emoji_feedback_message"] = formData.emojiFeedbackMessage;
  insertData["emoji_thank_you_message"] = formData.emojiThankYouMessage || "";
  insertData["ai_button_enabled"] = formData.aiButtonEnabled ?? true;
  insertData["falling_icon"] = formData.fallingIcon;
  
  // Map review_type to type for database
  if (formData.review_type) {
    insertData["type"] = formData.review_type;
  }
  
  // Remove camelCase keys
  delete insertData.emojiSentimentEnabled;
  delete insertData.emojiSentimentQuestion;
  delete insertData.emojiFeedbackMessage;
  delete insertData.emojiThankYouMessage;
  delete insertData.aiButtonEnabled;
  delete insertData.fallingEnabled;
  delete insertData.fallingIcon;
  delete insertData.emojiLabels;
  
  // Filter to only allowed DB columns
  const allowedColumns = [
    "id",
    "account_id",
    "slug",
    "client_name",
    "location",
    "project_type",
    "services_offered",
    "outcomes",
    "date_completed",
    "assigned_team_members",
    "review_platforms",
    "qr_code_url",
    "created_at",
    "is_universal",
    "team_member",
    "first_name",
    "last_name",
    "phone",
    "email",
    "offer_enabled",
    "offer_title",
    "offer_body",
    "category",
    "friendly_note",
    "offer_url",
    "status",
    "role",
    "falling_icon",
    "review_type",
    "type",
    "no_platform_review_template",
    "video_max_length",
    "video_quality",
    "video_preset",
    "video_questions",
    "video_note",
    "video_tips",
    "video_recipient",
    "emoji_sentiment_enabled",
    "emoji_sentiment_question",
    "emoji_feedback_message",
    "emoji_thank_you_message",
    "ai_button_enabled",
    "product_description",
    "features_or_benefits",
  ];
  return Object.fromEntries(
    Object.entries(insertData).filter(([k]) => allowedColumns.includes(k)),
  );
}

async function testUniversalPromptPageCreation() {
  console.log('🧪 Testing Universal Prompt Page Creation...\n');
  
  const testEmail = `test-universal-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const accountId = `test-account-${Date.now()}`;
  
  try {
    // 1. Create user via Supabase Auth
    console.log('1️⃣ Creating user via Supabase Auth...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      throw new Error(`Auth signup failed: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log('✅ User created successfully:', userId);

    // 2. Create account via API
    console.log('\n2️⃣ Creating account via /api/create-account...');
    const accountResponse = await fetch(`${APP_URL}/api/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
      }),
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      throw new Error(`Account creation failed: ${accountResponse.status} - ${errorText}`);
    }

    const accountData = await accountResponse.json();
    console.log('✅ Account created successfully:', accountData);

    // 3. Create business using the same logic as SimpleBusinessForm
    console.log('\n3️⃣ Creating business with universal prompt page...');
    
    const businessFormData = {
      name: `Test Business ${Date.now()}`,
      industry: ['technology'],
      business_website: 'https://example.com',
      business_email: 'contact@example.com',
      phone: '(555) 123-4567',
      address_street: '123 Test St',
      address_city: 'Test City',
      address_state: 'CA',
      address_zip: '12345',
      address_country: 'USA',
      services_offered: ['Web Development', 'Consulting']
    };

    // Create business first
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert([
        {
          account_id: userId,
          name: businessFormData.name,
          industry: businessFormData.industry,
          business_website: businessFormData.business_website,
          business_email: businessFormData.business_email,
          phone: businessFormData.phone,
          address_street: businessFormData.address_street,
          address_city: businessFormData.address_city,
          address_state: businessFormData.address_state,
          address_zip: businessFormData.address_zip,
          address_country: businessFormData.address_country,
          services_offered: businessFormData.services_offered,
        },
      ])
      .select()
      .single();

    if (businessError) {
      console.error("Business creation error:", businessError);
      throw new Error(`Failed to create business: ${businessError.message}`);
    }

    console.log('✅ Business created successfully:', business.id);

    // 4. Create universal prompt page (same logic as SimpleBusinessForm)
    console.log('\n4️⃣ Creating universal prompt page...');
    
    try {
      console.log("Creating universal prompt page...");
      const universalSlug = slugify("universal", Date.now().toString(36));
      
      const universalPromptPageData = {
        account_id: userId,
        slug: universalSlug,
        is_universal: true,
        status: "draft",
        review_type: "service",
        offer_enabled: false,
        offer_title: "",
        offer_body: "",
        offer_url: "",
        emoji_sentiment_enabled: false,
        emoji_sentiment_question: "How was your experience?",
        emoji_feedback_message: "We value your feedback! Let us know how we can do better.",
        emoji_thank_you_message: "Thank you for your feedback!",
        ai_button_enabled: true,
        falling_icon: "star",
        review_platforms: [],
        services_offered: businessFormData.services_offered || null,
      };

      console.log("Universal prompt page data before mapping:", universalPromptPageData);
      const mappedData = mapToDbColumns(universalPromptPageData);
      console.log("Universal prompt page data after mapping:", mappedData);

      const { data: universalPage, error: universalError } = await supabase
        .from("prompt_pages")
        .insert([mappedData])
        .select()
        .single();

      if (universalError) {
        console.error("Universal prompt page creation error:", universalError);
        console.error("Error details:", {
          code: universalError.code,
          message: universalError.message,
          details: universalError.details,
          hint: universalError.hint
        });
        throw new Error(`Universal prompt page creation failed: ${universalError.message}`);
      } else {
        console.log("✅ Universal prompt page created successfully:", universalPage);
      }
    } catch (universalErr) {
      console.error("Error creating universal prompt page:", universalErr);
      console.error("Error details:", {
        message: universalErr instanceof Error ? universalErr.message : 'Unknown error',
        stack: universalErr instanceof Error ? universalErr.stack : undefined
      });
      throw universalErr;
    }

    // 5. Verify universal prompt page was created
    console.log('\n5️⃣ Verifying universal prompt page creation...');
    const { data: verifyUniversal, error: verifyError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('account_id', userId)
      .eq('is_universal', true)
      .single();

    if (verifyError) {
      throw new Error(`Universal prompt page verification failed: ${verifyError.message}`);
    }

    console.log('✅ Universal prompt page verified in database:', verifyUniversal);

    console.log('\n🎉 All tests passed! Universal prompt page creation works correctly.');
    console.log('\n📋 Test Summary:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Business ID: ${business.id}`);
    console.log(`   Universal Prompt Page ID: ${verifyUniversal.id}`);
    console.log(`   Universal Prompt Page Slug: ${verifyUniversal.slug}`);
    console.log(`   Email: ${testEmail}`);
    
    return {
      userId,
      businessId: business.id,
      universalPromptPageId: verifyUniversal.id,
      email: testEmail,
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testUniversalPromptPageCreation(); 