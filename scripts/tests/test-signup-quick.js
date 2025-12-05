/**
 * Quick Signup & Business Creation Test
 * 
 * This script tests the actual signup flow by creating a real user
 * through Supabase Auth, then creates an account, then creates a business
 * using the real API endpoints (not direct DB insertion).
 * 
 * Updated: January 28, 2025 - Uses /api/businesses endpoint for realistic testing
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const APP_URL = 'http://localhost:3002';

async function testSignupAndBusinessFlow() {
  console.log('🧪 Quick Signup & Business Creation Test Starting...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  const testBusinessName = `Test Business ${Date.now()}`;
  
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

    // 3. Get session for authenticated requests
    console.log('\n3️⃣ Getting user session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (sessionError) {
      throw new Error(`Session creation failed: ${sessionError.message}`);
    }

    const accessToken = sessionData.session.access_token;
    console.log('✅ Session created successfully');

    // 4. Get account ID for the user
    console.log('\n4️⃣ Getting account ID for user...');
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', userId)
      .single();

    if (accountUserError) {
      throw new Error(`Failed to get account ID: ${accountUserError.message}`);
    }

    const accountId = accountUser.account_id;
    console.log('✅ Found account ID:', accountId);

    // 5. Create business via API (realistic flow)
    console.log('\n5️⃣ Creating business via /api/businesses...');
    
    // Test with minimal data (like the form should send)
    const minimalBusinessData = {
      name: testBusinessName,
      account_id: accountId,
    };
    
    console.log('📤 Sending business data:', JSON.stringify(minimalBusinessData, null, 2));
    
    const businessResponse = await fetch(`${APP_URL}/api/businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(minimalBusinessData),
    });

    if (!businessResponse.ok) {
      const errorText = await businessResponse.text();
      throw new Error(`Business creation failed: ${businessResponse.status} - ${errorText}`);
    }

    const businessData = await businessResponse.json();
    console.log('✅ Business created successfully:', businessData);

    // 6. Verify business was created
    console.log('\n6️⃣ Verifying business creation...');
    const { data: verifyBusiness, error: verifyError } = await supabase
      .from('businesses')
      .select('*')
      .eq('name', testBusinessName)
      .single();

    if (verifyError) {
      throw new Error(`Business verification failed: ${verifyError.message}`);
    }

    console.log('✅ Business verified in database:', verifyBusiness);

    // 6.5. Test full business form data (like the browser form should send)
    console.log('\n6️⃣.5️⃣ Testing full business form data (browser form simulation)...');
    
    const fullBusinessData = {
      name: `Full Form Business ${Date.now()}`,
      account_id: accountId,
      industry: 'technology',
      industries_other: '',
      business_website: 'https://example.com',
      business_email: 'test@example.com',
      phone: '+1234567890',
      address_street: '123 Test St',
      address_city: 'Test City',
      address_state: 'CA',
      address_zip: '12345',
      address_country: 'US',
      tagline: 'Test tagline',
      company_values: 'Test values',
      ai_dos: 'Test AI dos',
      ai_donts: 'Test AI donts',
      services_offered: 'Test services',
      differentiators: 'Test differentiators',
      years_in_business: '5',
      industry_experience: 'Test experience',
      target_audience: 'Test audience',
      business_goals: 'Test goals',
      challenges: 'Test challenges',
      success_metrics: 'Test metrics',
      budget_range: '10000-50000',
      timeline: '3-6 months',
      additional_notes: 'Test notes'
    };
    
    console.log('📤 Sending full business form data:', JSON.stringify(fullBusinessData, null, 2));
    
    const fullBusinessResponse = await fetch(`${APP_URL}/api/businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(fullBusinessData),
    });

    if (!fullBusinessResponse.ok) {
      const errorText = await fullBusinessResponse.text();
      throw new Error(`Full business form creation failed: ${fullBusinessResponse.status} - ${errorText}`);
    }

    const fullBusinessResult = await fullBusinessResponse.json();
    console.log('✅ Full business form data processed successfully:', fullBusinessResult);

    // 7. Test Grower plan selection (simulating pricing modal)
    console.log('\n7️⃣ Testing Grower plan selection...');
    
    // First, verify the account currently has 'no_plan'
    const { data: currentAccount, error: accountError } = await supabase
      .from('accounts')
      .select('plan')
      .eq('id', accountId)
      .single();

    if (accountError) {
      throw new Error(`Failed to get current account plan: ${accountError.message}`);
    }

    console.log('✅ Current account plan:', currentAccount.plan);

    if (currentAccount.plan !== 'no_plan') {
      throw new Error(`Expected plan to be 'no_plan', but got: ${currentAccount.plan}`);
    }

    // Update account to 'grower' plan (simulating user selection)
    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({ plan: 'grower' })
      .eq('id', accountId)
      .select('plan')
      .single();

    if (updateError) {
      throw new Error(`Failed to update account plan: ${updateError.message}`);
    }

    console.log('✅ Account plan updated to:', updatedAccount.plan);

    if (updatedAccount.plan !== 'grower') {
      throw new Error(`Expected plan to be 'grower', but got: ${updatedAccount.plan}`);
    }

    // 8. Test Universal Prompt Page functionality
    console.log('\n8️⃣ Testing Universal Prompt Page functionality...');
    
    // Check if universal prompt page exists
    const { data: universalPages, error: universalError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_universal', true);

    if (universalError) {
      throw new Error(`Failed to find universal prompt pages: ${universalError.message}`);
    }

    if (!universalPages || universalPages.length === 0) {
      throw new Error('No universal prompt pages found for this account');
    }

    // Use the most recent universal page
    const universalPage = universalPages[universalPages.length - 1];
    console.log(`✅ Found ${universalPages.length} universal prompt page(s), using most recent`);

    console.log('✅ Universal prompt page found:', {
      id: universalPage.id,
      slug: universalPage.slug,
      title: universalPage.title
    });

    // Test accessing the universal prompt page edit route
    console.log('\n9️⃣ Testing Universal Prompt Page edit route...');
    const editPageResponse = await fetch(`${APP_URL}/dashboard/edit-prompt-page/universal`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!editPageResponse.ok) {
      const errorText = await editPageResponse.text();
      throw new Error(`Universal prompt page edit route failed: ${editPageResponse.status} - ${errorText}`);
    }

    console.log('✅ Universal prompt page edit route accessible');

    // 9.5. Test the exact issue you're experiencing - business lookup by account_id
    console.log('\n9️⃣.5️⃣ Testing business lookup by account_id (debugging your issue)...');
    
    // Check if businesses exist for this account
    const { data: accountBusinesses, error: businessesError } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', accountId);

    if (businessesError) {
      throw new Error(`Failed to lookup businesses for account: ${businessesError.message}`);
    }

    console.log(`📊 Found ${accountBusinesses.length} businesses for account ${accountId}:`);
    accountBusinesses.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name} (ID: ${business.id})`);
    });

    if (accountBusinesses.length === 0) {
      console.log('⚠️  WARNING: No businesses found for this account! This is the issue you\'re experiencing.');
      console.log('🔍 Debugging info:');
      console.log(`   Account ID: ${accountId}`);
      console.log(`   User ID: ${userId}`);
      
      // Check if account exists
      const { data: accountCheck, error: accountCheckError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (accountCheckError) {
        console.log(`   ❌ Account lookup failed: ${accountCheckError.message}`);
      } else {
        console.log(`   ✅ Account exists: ${accountCheck.email}`);
      }
    } else {
      console.log('✅ Businesses found - this account has proper business creation.');
    }

    // Test that the universal prompt page has the expected data structure
    console.log('\n🔍 Checking universal prompt page data structure...');
    const expectedFields = [
      'id', 'account_id', 'slug', 'is_universal', 'created_at', 'updated_at'
    ];
    
    for (const field of expectedFields) {
      if (!(field in universalPage)) {
        throw new Error(`Universal prompt page missing required field: ${field}`);
      }
    }
    
    console.log('✅ Universal prompt page has all required fields');

    // 10. Test the specific failing account ID from your logs
    console.log('\n🔟 Testing the specific failing account ID from your logs...');
    const failingAccountId = '7c09e67b-ae0d-4558-bfd1-e53a55cf6355';
    
    console.log(`🔍 Checking account: ${failingAccountId}`);
    
    // Check if this account exists
    const { data: failingAccount, error: failingAccountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', failingAccountId)
      .single();
    
    if (failingAccountError) {
      console.log(`❌ Account ${failingAccountId} not found: ${failingAccountError.message}`);
    } else {
      console.log(`✅ Account ${failingAccountId} exists: ${failingAccount.email}`);
      
      // Check if this account has any businesses
      const { data: failingAccountBusinesses, error: failingBusinessesError } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', failingAccountId);
      
      if (failingBusinessesError) {
        console.log(`❌ Failed to check businesses for account ${failingAccountId}: ${failingBusinessesError.message}`);
      } else {
        console.log(`📊 Account ${failingAccountId} has ${failingAccountBusinesses.length} businesses:`);
        failingAccountBusinesses.forEach((business, index) => {
          console.log(`   ${index + 1}. ${business.name} (ID: ${business.id})`);
        });
        
        if (failingAccountBusinesses.length === 0) {
          console.log('⚠️  This confirms the issue: Account exists but has no businesses!');
          console.log('🔧 This means the business creation form is not working in the browser.');
        }
      }
    }

    console.log('\n🎉 All tests passed! Signup, business creation, and universal prompt page flow works correctly.');
    console.log('\n📋 Test Summary:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Account ID: ${accountId}`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Business: ${testBusinessName}`);
    console.log(`   Business ID: ${verifyBusiness.id}`);
    console.log(`   Universal Prompt Page ID: ${universalPage.id}`);
    console.log(`   Universal Prompt Page Slug: ${universalPage.slug}`);
    
    // Return test data for cleanup
    return {
      userId,
      accountId,
      email: testEmail,
      businessId: verifyBusiness.id,
      businessName: testBusinessName,
      universalPageId: universalPage.id,
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSignupAndBusinessFlow(); 