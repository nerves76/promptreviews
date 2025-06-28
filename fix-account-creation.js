/**
 * Fix Account Creation for Existing User
 * 
 * This script creates a proper account for the existing user boltro3000@gmail.com
 * using the correct UUID format and proper field structure.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function createAccountForUser() {
  console.log('🔧 Creating account for existing user...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // The user ID we know exists from our previous check
    const userId = 'c2d84970-fa23-4fe6-b3d7-3e6e4e1c7c1c';
    const userEmail = 'boltro3000@gmail.com';
    
    console.log('👤 User ID:', userId);
    console.log('📧 User Email:', userEmail);
    
    // Create account with minimal required fields
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        id: userId,
        email: userEmail,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (accountError) {
      console.error('❌ Account creation failed:', accountError);
      return false;
    }
    
    console.log('✅ Account created successfully');
    console.log('📋 Account details:', account);
    
    // Create account_users relationship
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .insert({
        account_id: userId,
        user_id: userId,
        role: 'owner'
      })
      .select()
      .single();
    
    if (accountUserError) {
      console.error('❌ Account user relationship creation failed:', accountUserError);
      return false;
    }
    
    console.log('✅ Account user relationship created successfully');
    console.log('📋 Account user details:', accountUser);
    
    return true;
    
  } catch (err) {
    console.error('❌ Exception during account creation:', err);
    return false;
  }
}

async function verifyAccountCreation() {
  console.log('\n🔍 Verifying account creation...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check accounts table
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', 'boltro3000@gmail.com');
    
    if (accountsError) {
      console.error('❌ Error checking accounts:', accountsError);
      return;
    }
    
    console.log('📊 Accounts found:', accounts?.length || 0);
    if (accounts && accounts.length > 0) {
      console.log('📋 Account details:', accounts[0]);
    }
    
    // Check account_users table
    const { data: accountUsers, error: accountUsersError } = await supabase
      .from('account_users')
      .select('*')
      .eq('user_id', 'c2d84970-fa23-4fe6-b3d7-3e6e4e1c7c1c');
    
    if (accountUsersError) {
      console.error('❌ Error checking account_users:', accountUsersError);
      return;
    }
    
    console.log('📊 Account users found:', accountUsers?.length || 0);
    if (accountUsers && accountUsers.length > 0) {
      console.log('📋 Account user details:', accountUsers[0]);
    }
    
  } catch (err) {
    console.error('❌ Exception during verification:', err);
  }
}

async function testSignupFlow() {
  console.log('\n🧪 Testing signup flow fix...');
  
  // Test the account creation with proper UUID
  const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format
  const testEmail = 'test-signup@example.com';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    const { data: testAccount, error: testError } = await supabase
      .from('accounts')
      .insert({
        id: testUserId,
        email: testEmail,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Test account creation failed:', testError);
    } else {
      console.log('✅ Test account created successfully');
      console.log('📋 Test account:', testAccount);
      
      // Clean up test account
      await supabase
        .from('accounts')
        .delete()
        .eq('id', testUserId);
      console.log('🧹 Test account cleaned up');
    }
    
  } catch (err) {
    console.error('❌ Exception during test:', err);
  }
}

async function main() {
  console.log('🚀 Starting account creation fix...\n');
  
  const success = await createAccountForUser();
  
  if (success) {
    await verifyAccountCreation();
    await testSignupFlow();
  }
  
  console.log('\n✅ Account creation fix completed');
}

main().catch(console.error); 