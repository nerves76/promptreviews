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
const APP_URL = 'http://localhost:3001';

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
    const businessResponse = await fetch(`${APP_URL}/api/businesses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: testBusinessName,
        account_id: accountId,
      }),
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

    console.log('\n🎉 All tests passed! Signup and business creation flow works correctly.');
    console.log('\n📋 Test Summary:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Account ID: ${accountId}`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Business: ${testBusinessName}`);
    console.log(`   Business ID: ${verifyBusiness.id}`);
    
    // Return test data for cleanup
    return {
      userId,
      accountId,
      email: testEmail,
      businessId: verifyBusiness.id,
      businessName: testBusinessName,
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSignupAndBusinessFlow(); 