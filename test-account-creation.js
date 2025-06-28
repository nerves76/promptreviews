/**
 * Test Account Creation
 * 
 * This script tests account creation with the correct foreign key reference to auth.users
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testAccountCreation() {
  console.log('🧪 Testing account creation...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // First, let's check if the user exists in auth.users
    console.log('🔍 Checking for user in auth.users...');
    
    // We need to use the service role key to access auth.users
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
    const supabaseAdmin = createClient(SUPABASE_URL, serviceRoleKey);
    
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error listing users:', usersError);
      return;
    }
    
    const user = users?.find(u => u.email === 'boltro3000@gmail.com');
    if (!user) {
      console.log('❌ User not found in auth.users');
      return;
    }
    
    console.log('✅ User found in auth.users');
    console.log('🆔 User ID:', user.id);
    console.log('📧 User Email:', user.email);
    console.log('✅ Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
    
    // Now try to create an account for this user
    console.log('\n🔄 Creating account for user...');
    
    const { data: account, error: accountError } = await supabaseAdmin
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
      console.error('❌ Account creation failed:', accountError);
      return;
    }
    
    console.log('✅ Account created successfully!');
    console.log('📋 Account details:', account);
    
    // Also create the account_users relationship
    console.log('\n🔄 Creating account_users relationship...');
    
    const { data: accountUser, error: accountUserError } = await supabaseAdmin
      .from('account_users')
      .insert({
        account_id: user.id,
        user_id: user.id,
        role: 'owner'
      })
      .select()
      .single();
    
    if (accountUserError) {
      console.error('❌ Account user relationship creation failed:', accountUserError);
    } else {
      console.log('✅ Account user relationship created successfully!');
      console.log('📋 Account user details:', accountUser);
    }
    
    // Verify the account was created
    console.log('\n🔍 Verifying account creation...');
    
    const { data: verifyAccount, error: verifyError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying account:', verifyError);
    } else {
      console.log('✅ Account verification successful');
      console.log('📋 Verified account:', verifyAccount);
    }
    
  } catch (err) {
    console.error('❌ Exception during test:', err);
  }
}

async function main() {
  console.log('🚀 Starting account creation test...\n');
  
  await testAccountCreation();
  
  console.log('\n✅ Account creation test completed');
}

main().catch(console.error); 