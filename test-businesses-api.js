const { createClient } = require('@supabase/supabase-js');

// Test script to check businesses API endpoint
async function testBusinessesAPI() {
  console.log('🧪 Testing Businesses API Endpoint...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    // Create a test user
    const testEmail = `test-businesses-api-${Date.now()}@example.com`;
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

    // Test the businesses API endpoint
    console.log('\n3️⃣ Testing businesses API endpoint...');
    
    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail
    });

    if (sessionError) {
      console.error('❌ Session creation error:', sessionError);
      return;
    }

    // Extract the access token from the session
    const accessToken = sessionData.properties.access_token;
    
    // Make a request to the businesses API
    const response = await fetch('http://localhost:3001/api/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: `Test Business API ${Date.now()}`,
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
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (!response.ok) {
      console.error('❌ API request failed:', result);
      return;
    }

    console.log('✅ Business created via API');

    // Check if universal prompt page was created
    console.log('\n4️⃣ Checking if universal prompt page was created...');
    const { data: universalPages, error: universalError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('account_id', userId)
      .eq('is_universal', true);

    if (universalError) {
      console.error('❌ Universal pages fetch error:', universalError);
      return;
    }

    console.log('Universal pages found:', universalPages.length);
    if (universalPages.length > 0) {
      console.log('✅ Universal prompt page created:', {
        id: universalPages[0].id,
        slug: universalPages[0].slug,
        offer_enabled: universalPages[0].offer_enabled,
        emoji_sentiment_enabled: universalPages[0].emoji_sentiment_enabled,
        falling_icon: universalPages[0].falling_icon,
        ai_button_enabled: universalPages[0].ai_button_enabled
      });
    } else {
      console.log('❌ No universal prompt page was created');
    }

    // Check all prompt pages for this account
    const { data: allPages, error: allPagesError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('account_id', userId);

    if (allPagesError) {
      console.error('❌ All pages fetch error:', allPagesError);
      return;
    }

    console.log('\nAll prompt pages for account:', allPages.length);
    allPages.forEach((page, index) => {
      console.log(`  ${index + 1}. ID: ${page.id}, Slug: ${page.slug}, Universal: ${page.is_universal}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBusinessesAPI(); 