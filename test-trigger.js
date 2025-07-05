/**
 * Test Database Trigger for Account Creation
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testTrigger() {
  console.log('🔧 TESTING DATABASE TRIGGER');
  console.log('===========================\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Test creating a user directly with service role
    console.log('1️⃣ Testing user creation with service role...');
    const testEmail = `trigger-test-${Date.now()}@example.com`;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        first_name: 'Trigger',
        last_name: 'Test'
      }
    });

    if (authError) {
      console.error('❌ Error creating user:', authError.message);
      return;
    }

    const userId = authData.user.id;
    console.log('✅ User created successfully:', userId);
    console.log('📧 Email:', testEmail);

    // Wait a moment for the trigger to execute
    console.log('\n2️⃣ Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if account was created
    console.log('\n3️⃣ Checking if account was created by trigger...');
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, plan, email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (accountError) {
      console.error('❌ Account not found:', accountError.message);
    } else {
      console.log('✅ Account found:', account);
    }

    // Check if account_users record was created
    console.log('\n4️⃣ Checking if account_users record was created...');
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .select('account_id, user_id, role')
      .eq('user_id', userId)
      .single();

    if (accountUserError) {
      console.error('❌ Account_users record not found:', accountUserError.message);
    } else {
      console.log('✅ Account_users record found:', accountUser);
    }

    // Final summary
    console.log('\n🎯 TRIGGER TEST SUMMARY');
    console.log('=======================');
    console.log(`User ID: ${userId}`);
    console.log(`Email: ${testEmail}`);
    console.log(`Account created: ${account ? 'Yes' : 'No'}`);
    console.log(`Account_users created: ${accountUser ? 'Yes' : 'No'}`);
    
    if (account && accountUser) {
      console.log('\n🎉 SUCCESS! Database trigger is working correctly!');
      console.log('✅ Accounts are now created automatically when users sign up');
      console.log('✅ This eliminates the need for the create-account API');
      console.log('✅ Authentication infinite loading issues should be resolved');
    } else {
      console.log('\n❌ TRIGGER NOT WORKING');
      console.log('🔧 The database trigger needs to be fixed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTrigger(); 