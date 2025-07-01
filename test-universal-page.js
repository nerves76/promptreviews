const { createClient } = require('@supabase/supabase-js');

// Test script to check universal prompt page edit functionality
async function testUniversalPage() {
  console.log('🧪 Testing Universal Prompt Page Edit Functionality...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    // Create a test user
    const testEmail = `test-universal-${Date.now()}@example.com`;
    console.log('1️⃣ Creating test user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }

    const userId = authData.user.id;
    console.log('✅ User created:', userId);

    // Create account
    console.log('\n2️⃣ Creating account...');
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .insert({
        id: userId,
        plan: 'no_plan',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0,
        first_name: 'Test',
        last_name: 'User',
        email: testEmail,
        has_seen_welcome: false,
        review_notifications_enabled: true
      })
      .select()
      .single();

    if (accountError) {
      console.error('❌ Account creation error:', accountError);
      return;
    }

    console.log('✅ Account created');

    // Create account_users record
    const { error: accountUserError } = await supabase
      .from('account_users')
      .insert({
        account_id: userId,
        user_id: userId,
        role: 'owner'
      });

    if (accountUserError) {
      console.error('❌ Account user creation error:', accountUserError);
      return;
    }

    // Create business
    console.log('\n3️⃣ Creating business...');
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: `Test Business ${Date.now()}`,
        account_id: userId,
        primary_color: '#4F46E5',
        secondary_color: '#818CF8',
        background_color: '#FFFFFF',
        text_color: '#1F2937',
        primary_font: 'Inter',
        secondary_font: 'Inter',
        background_type: 'gradient',
        gradient_start: '#4F46E5',
        gradient_middle: '#818CF8',
        gradient_end: '#C7D2FE',
        default_offer_enabled: false,
        default_offer_title: 'Review Rewards'
      })
      .select()
      .single();

    if (businessError) {
      console.error('❌ Business creation error:', businessError);
      return;
    }

    console.log('✅ Business created:', businessData.id);

    // Check if universal prompt page exists
    console.log('\n4️⃣ Checking universal prompt page...');
    const { data: universalPage, error: universalError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('account_id', userId)
      .eq('is_universal', true)
      .single();

    if (universalError) {
      console.error('❌ Universal page fetch error:', universalError);
      return;
    }

    console.log('✅ Universal prompt page found:', {
      id: universalPage.id,
      slug: universalPage.slug,
      offer_enabled: universalPage.offer_enabled,
      emoji_sentiment_enabled: universalPage.emoji_sentiment_enabled,
      falling_icon: universalPage.falling_icon,
      ai_button_enabled: universalPage.ai_button_enabled,
      review_platforms: universalPage.review_platforms
    });

    // Test the edit page by making a request to it
    console.log('\n5️⃣ Testing edit page accessibility...');
    
    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail,
      options: {
        redirectTo: 'http://localhost:3001/dashboard/edit-prompt-page/universal'
      }
    });

    if (sessionError) {
      console.error('❌ Session creation error:', sessionError);
    } else {
      console.log('✅ Edit page should be accessible at:');
      console.log(`   http://localhost:3001/dashboard/edit-prompt-page/universal`);
      console.log('\n📋 Test Summary:');
      console.log(`   User ID: ${userId}`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   Business ID: ${businessData.id}`);
      console.log(`   Universal Page ID: ${universalPage.id}`);
      console.log(`   Universal Page Slug: ${universalPage.slug}`);
      console.log('\n🎯 Next Steps:');
      console.log('   1. Visit the edit page URL above');
      console.log('   2. Check if form components are visible');
      console.log('   3. Check browser console for any errors');
      console.log('   4. Verify that all sections (Review Platforms, Offer, Emoji, etc.) are shown');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUniversalPage(); 