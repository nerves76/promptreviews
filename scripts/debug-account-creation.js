/**
 * Debug Account Creation
 * 
 * This script helps debug account creation issues
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function debugAccountCreation() {
  console.log('🔍 DEBUG ACCOUNT CREATION');
  console.log('=========================\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check if there are any accounts at all
    console.log('1️⃣ Checking all accounts...');
    const { data: allAccounts, error: allAccountsError } = await supabase
      .from('accounts')
      .select('id, plan, email, created_at')
      .limit(10);

    if (allAccountsError) {
      console.error('❌ Error querying accounts:', allAccountsError.message);
      return;
    }

    console.log(`✅ Found ${allAccounts.length} accounts:`);
    allAccounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ID: ${account.id}, Plan: ${account.plan}, Email: ${account.email}`);
    });

    // Check account_users table
    console.log('\n2️⃣ Checking account_users table...');
    const { data: allAccountUsers, error: allAccountUsersError } = await supabase
      .from('account_users')
      .select('account_id, user_id, role')
      .limit(10);

    if (allAccountUsersError) {
      console.error('❌ Error querying account_users:', allAccountUsersError.message);
      return;
    }

    console.log(`✅ Found ${allAccountUsers.length} account_users records:`);
    allAccountUsers.forEach((record, index) => {
      console.log(`   ${index + 1}. Account: ${record.account_id}, User: ${record.user_id}, Role: ${record.role}`);
    });

    // Test creating a new user and account
    console.log('\n3️⃣ Testing user creation...');
    const testEmail = `debug-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.error('❌ Error creating user:', authError.message);
      return;
    }

    const userId = authData.user.id;
    console.log('✅ User created successfully:', userId);

    // Check if account was created automatically
    console.log('\n4️⃣ Checking if account was created automatically...');
    const { data: newAccount, error: newAccountError } = await supabase
      .from('accounts')
      .select('id, plan, email')
      .eq('id', userId)
      .single();

    if (newAccountError) {
      console.log('⚠️  No account found automatically:', newAccountError.message);
    } else {
      console.log('✅ Account found automatically:', newAccount);
    }

    // Check if account_users record was created
    console.log('\n5️⃣ Checking if account_users record was created...');
    const { data: newAccountUser, error: newAccountUserError } = await supabase
      .from('account_users')
      .select('account_id, user_id, role')
      .eq('user_id', userId)
      .single();

    if (newAccountUserError) {
      console.log('⚠️  No account_users record found:', newAccountUserError.message);
    } else {
      console.log('✅ Account_users record found:', newAccountUser);
    }

    console.log('\n🎯 Summary:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Account exists: ${newAccount ? 'Yes' : 'No'}`);
    console.log(`   Account_users exists: ${newAccountUser ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAccountCreation(); 