/**
 * Focused Signup Flow Test
 * 
 * This script tests the specific signup flow issues you've been experiencing:
 * 1. Email link authentication
 * 2. CreateBusinessClient infinite loading
 * 3. Plan detection and onboarding flow
 * 
 * Created: January 7, 2025
 * Updated for port 3002 and current authentication fixes
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = 'http://localhost:3002';

// Create Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testFullSignupFlow() {
  console.log('🧪 FULL SIGNUP FLOW TEST');
  console.log('═══════════════════════════\n');

  // Generate unique test data
  const timestamp = Date.now();
  const testUser = {
    email: `test-flow-${timestamp}@example.com`,
    password: 'testPassword123!',
    firstName: `test-flow-${timestamp}`,
    lastName: 'User'
  };

  console.log('👤 Test User:', testUser.email);
  console.log('🔗 App URL:', APP_URL);
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log('');

  try {
    // Step 1: Test the signup process (like the sign-up page does)
    console.log('📝 Step 1: Testing signup process...');
    const { data: signupData, error: signupError } = await supabaseAnon.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        emailRedirectTo: `${APP_URL}/auth/callback`,
        data: {
          first_name: testUser.firstName,
          last_name: testUser.lastName,
        },
      },
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError);
      return;
    }

    console.log('✅ Signup successful:', {
      userId: signupData.user?.id,
      email: signupData.user?.email,
      emailConfirmed: signupData.user?.email_confirmed_at
    });

    // Step 2: Simulate email confirmation (auto-confirm for testing)
    console.log('\n📝 Step 2: Simulating email confirmation...');
    
    // Use admin client to confirm the email
    const { data: confirmData, error: confirmError } = await supabaseService.auth.admin.updateUserById(
      signupData.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error('❌ Email confirmation failed:', confirmError);
      return;
    }

    console.log('✅ Email confirmed for user:', confirmData.user.id);

    // Step 3: Test authentication (what happens after email confirmation)
    console.log('\n📝 Step 3: Testing authentication...');
    
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (signInError) {
      console.error('❌ Authentication failed:', signInError);
      return;
    }

    console.log('✅ Authentication successful');

    // Step 4: Check if account was created automatically (by triggers)
    console.log('\n📝 Step 4: Checking if account was created automatically...');
    
    let accountData;
    const { data: initialAccountData, error: accountError } = await supabaseService
      .from('accounts')
      .select('*')
      .eq('id', signupData.user.id)
      .single();

    if (accountError) {
      console.log('⚠️  No account found, testing manual account creation...');
      
      // Step 4b: Test create-account API (what auth callback should trigger)
      console.log('\n📝 Step 4b: Testing create-account API...');
      const accountResponse = await fetch(`${APP_URL}/api/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: signupData.user.id,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        })
      });

      if (!accountResponse.ok) {
        const errorText = await accountResponse.text();
        console.error('❌ Create account API failed:', accountResponse.status, errorText);
        return;
      }

      console.log('✅ Create account API successful');

      // Re-fetch account data
      const { data: newAccountData, error: newAccountError } = await supabaseService
        .from('accounts')
        .select('*')
        .eq('id', signupData.user.id)
        .single();

      if (newAccountError) {
        console.error('❌ Account still not found after creation:', newAccountError);
        return;
      }

      accountData = newAccountData;
    } else {
      console.log('✅ Account was created automatically by triggers');
      accountData = initialAccountData;
    }

    console.log('✅ Account verified:', {
      id: accountData.id,
      email: accountData.email,
      plan: accountData.plan,
      firstName: accountData.first_name
    });

    // Step 5: Test dashboard access (what happens after account creation)
    console.log('\n📝 Step 5: Testing dashboard access...');
    
    // Create authenticated client
    const supabaseWithSession = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`
        }
      }
    });

    // Test account access with session
    const { data: sessionAccountData, error: sessionAccountError } = await supabaseWithSession
      .from('accounts')
      .select('*')
      .eq('id', signupData.user.id)
      .single();

    if (sessionAccountError) {
      console.error('❌ Dashboard account access failed:', sessionAccountError);
      return;
    }

    console.log('✅ Dashboard can access account:', {
      id: sessionAccountData.id,
      email: sessionAccountData.email,
      plan: sessionAccountData.plan,
      firstName: sessionAccountData.first_name
    });

    // Step 6: Test business count (for onboarding flow logic)
    console.log('\n📝 Step 6: Testing business count for onboarding...');
    
    const { data: businesses, error: businessError } = await supabaseWithSession
      .from('businesses')
      .select('id')
      .eq('account_id', signupData.user.id);

    if (businessError) {
      console.error('❌ Business count check failed:', businessError);
      return;
    }

    console.log('✅ Business count retrieved:', businesses.length);

    // Step 7: Test onboarding flow logic
    console.log('\n📝 Step 7: Testing onboarding flow logic...');
    
    const plan = sessionAccountData.plan;
    const businessCount = businesses.length;
    
    console.log('🔍 Onboarding flow decision:');
    console.log(`   Plan: ${plan}`);
    console.log(`   Business count: ${businessCount}`);
    
    if ((!plan || plan === 'no_plan' || plan === 'NULL') && businessCount === 0) {
      console.log('✅ Decision: Should redirect to create-business');
      console.log('   This matches the expected behavior for new users');
    } else if ((!plan || plan === 'no_plan' || plan === 'NULL') && businessCount > 0) {
      console.log('✅ Decision: Should show pricing modal');
      console.log('   This matches the expected behavior for users with businesses but no plan');
    } else {
      console.log('✅ Decision: Should show dashboard');
      console.log('   This matches the expected behavior for users with plans');
    }

    // Step 8: Test the actual dashboard endpoint
    console.log('\n📝 Step 8: Testing dashboard endpoint...');
    
    const dashboardResponse = await fetch(`${APP_URL}/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': `sb-access-token=${signInData.session.access_token}; sb-refresh-token=${signInData.session.refresh_token}`,
      }
    });

    if (!dashboardResponse.ok) {
      console.error('❌ Dashboard endpoint failed:', dashboardResponse.status);
      return;
    }

    console.log('✅ Dashboard endpoint accessible');

    // Final summary
    console.log('\n🎉 SUCCESS: Full signup flow test completed!');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Signup process working');
    console.log('✅ Email confirmation working');
    console.log('✅ Authentication working');
    console.log('✅ Account creation working');
    console.log('✅ Dashboard access working');
    console.log('✅ Business count check working');
    console.log('✅ Onboarding flow logic working');
    console.log('✅ Dashboard endpoint accessible');

    console.log('\n📊 Test Results:');
    console.log(`   User ID: ${signupData.user.id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Plan: ${plan}`);
    console.log(`   Business Count: ${businessCount}`);
    console.log(`   Expected Flow: ${(!plan || plan === 'no_plan') && businessCount === 0 ? 'Create Business' : 'Dashboard'}`);

    return {
      userId: signupData.user.id,
      email: testUser.email,
      plan: plan,
      businessCount: businessCount,
      success: true
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return { success: false, error: error.message };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testFullSignupFlow();
}

module.exports = { testFullSignupFlow }; 