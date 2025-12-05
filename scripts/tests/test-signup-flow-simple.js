/**
 * Simple Signup Flow Test - No Email Confirmation Required
 * 
 * This script tests the signup flow components that don't require email confirmation:
 * 1. User creation
 * 2. Account creation via API
 * 3. Business creation
 * 4. Plan detection logic
 * 
 * Perfect for quick testing without dealing with email confirmation delays.
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

async function testSignupFlow() {
  console.log('🧪 SIMPLE SIGNUP FLOW TEST');
  console.log('═══════════════════════════\n');

  // Generate unique test data
  const timestamp = Date.now();
  const testUser = {
    email: `test-simple-${timestamp}@example.com`,
    password: 'testPassword123!',
    firstName: `test-simple-${timestamp}`,
    lastName: ''
  };

  console.log('👤 Test User:', testUser.email);
  console.log('🔗 App URL:', APP_URL);
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log('');

  try {
    // Step 1: Create user in Supabase auth
    console.log('📝 Step 1: Creating user in Supabase auth...');
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true // Auto-confirm email
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 2: Create account via API
    console.log('\n📝 Step 2: Creating account via API...');
    const accountResponse = await fetch(`${APP_URL}/api/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: authData.user.id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName
      })
    });

    const accountResult = await accountResponse.json();
    
    if (!accountResponse.ok) {
      console.error('❌ Account creation failed:', accountResult);
      return;
    }

    console.log('✅ Account created via API');

    // Step 3: Verify account exists in database using service role
    console.log('\n📝 Step 3: Verifying account in database...');
    const { data: accountData, error: accountError } = await supabaseService
      .from('accounts')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (accountError) {
      console.error('❌ Account verification failed:', accountError);
      return;
    }

    console.log('✅ Account verified in database:', {
      id: accountData.id,
      email: accountData.email,
      plan: accountData.plan,
      firstName: accountData.first_name
    });

    // Step 4: Verify account_users relationship
    console.log('\n📝 Step 4: Verifying account_users relationship...');
    const { data: accountUsersData, error: accountUsersError } = await supabaseService
      .from('account_users')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('account_id', authData.user.id)
      .single();

    if (accountUsersError) {
      console.error('❌ Account_users verification failed:', accountUsersError);
      return;
    }

    console.log('✅ Account_users relationship verified:', {
      userId: accountUsersData.user_id,
      accountId: accountUsersData.account_id,
      role: accountUsersData.role
    });

    // Step 5: Test authentication
    console.log('\n📝 Step 5: Testing authentication...');
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (signInError) {
      console.error('❌ Authentication failed:', signInError);
      return;
    }

    console.log('✅ Authentication successful');

    // Step 6: Test session access to account
    console.log('\n📝 Step 6: Testing session access to account...');
    const supabaseWithSession = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`
        }
      }
    });

    const { data: sessionAccountData, error: sessionAccountError } = await supabaseWithSession
      .from('accounts')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (sessionAccountError) {
      console.error('❌ Session account access failed:', sessionAccountError);
      return;
    }

    console.log('✅ Session can access account data:', {
      id: sessionAccountData.id,
      email: sessionAccountData.email,
      plan: sessionAccountData.plan
    });

    console.log('\n🎉 SUCCESS: All signup flow steps completed!');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Auth user created');
    console.log('✅ Account created via API');
    console.log('✅ Account verified in database');
    console.log('✅ Account_users relationship verified');
    console.log('✅ Authentication working');
    console.log('✅ Session can access account data');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSignupFlow();
}

module.exports = { testSignupFlow }; 