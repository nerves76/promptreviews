/**
 * Create Test User and Test Signup Flow
 * 
 * This script creates a test user and verifies that the signup flow works correctly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function createTestUser() {
  console.log('👤 Creating test user...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Create a new user
    const { data, error } = await supabase.auth.signUp({
      email: 'test-signup@example.com',
      password: 'testpassword123',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });
    
    if (error) {
      console.error('❌ User creation failed:', error);
      return null;
    }
    
    console.log('✅ User created successfully');
    console.log('📧 Email:', data.user?.email);
    console.log('🆔 User ID:', data.user?.id);
    console.log('✅ Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    
    return data.user;
    
  } catch (err) {
    console.error('❌ Exception during user creation:', err);
    return null;
  }
}

async function checkAccountCreation(user) {
  console.log('\n🔍 Checking if account was created...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check if account exists
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (accountError) {
      console.log('❌ Account not found:', accountError.message);
      return false;
    }
    
    console.log('✅ Account found!');
    console.log('📋 Account details:', account);
    return true;
    
  } catch (err) {
    console.error('❌ Exception checking account:', err);
    return false;
  }
}

async function manuallyCreateAccount(user) {
  console.log('\n🔧 Manually creating account...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        id: user.id,
        plan: 'grower',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0
      })
      .select()
      .single();
    
    if (accountError) {
      console.error('❌ Manual account creation failed:', accountError);
      return false;
    }
    
    console.log('✅ Manual account creation successful');
    console.log('📋 Account details:', account);
    return true;
    
  } catch (err) {
    console.error('❌ Exception during manual account creation:', err);
    return false;
  }
}

async function testSignupFlow() {
  console.log('🧪 Testing complete signup flow...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Create a new user with a different email
    const { data, error } = await supabase.auth.signUp({
      email: 'signup-test@example.com',
      password: 'testpassword123',
      options: {
        data: {
          first_name: 'Signup',
          last_name: 'Test'
        }
      }
    });
    
    if (error) {
      console.error('❌ Signup failed:', error);
      return;
    }
    
    console.log('✅ Signup successful');
    console.log('📧 Email:', data.user?.email);
    console.log('🆔 User ID:', data.user?.id);
    
    // Wait a moment for any background processes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if account was created automatically
    const accountExists = await checkAccountCreation(data.user);
    
    if (!accountExists) {
      console.log('⚠️ Account was not created automatically');
      console.log('🔧 This indicates the signup flow needs to be fixed');
    } else {
      console.log('✅ Account was created automatically - signup flow is working!');
    }
    
  } catch (err) {
    console.error('❌ Exception during signup test:', err);
  }
}

async function main() {
  console.log('🚀 Starting signup flow test...\n');
  
  // Create a test user
  const user = await createTestUser();
  
  if (user) {
    // Check if account was created automatically
    const accountExists = await checkAccountCreation(user);
    
    if (!accountExists) {
      // Manually create account to test the foreign key constraint
      await manuallyCreateAccount(user);
    }
  }
  
  // Test the complete signup flow
  await testSignupFlow();
  
  console.log('\n✅ Signup flow test completed');
}

main().catch(console.error); 