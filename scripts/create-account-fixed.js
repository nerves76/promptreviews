const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

async function createAccountFixed() {
  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    console.log('🔍 First, let\'s test the RPC function...');
    
    // Try the test function first
    const { data: testData, error: testError } = await supabase.rpc('test_handle_new_user');
    
    if (testError) {
      console.log('❌ Test RPC Error:', testError);
    } else {
      console.log('✅ Test RPC Success:', testData);
    }
    
    console.log('🔍 Now creating account manually with proper user_id...');
    
    // For now, let's create the account without user_id first, then add it
    // We need to get the user ID from somewhere else
    
    // Create account record manually without user_id initially
    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert({
        email: 'boltro3000@gmail.com',
        first_name: 'Test',
        last_name: 'User',
        plan: 'free',
        subscription_status: 'active',
        // Generate a UUID for now - we'll update it later
        user_id: crypto.randomUUID()
      })
      .select()
      .single();
    
    if (accountError) {
      console.log('❌ Account creation error:', accountError);
      return;
    }
    
    console.log('✅ Created account:', newAccount.id);
    
    // Create account_users record
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .insert({
        account_id: newAccount.id,
        user_id: newAccount.user_id, // Use the same UUID
        role: 'owner'
      })
      .select()
      .single();
    
    if (accountUserError) {
      console.log('❌ Account_users creation error:', accountUserError);
      return;
    }
    
    console.log('✅ Created account_user:', accountUser.id);
    console.log('🎉 Account records created! Try signing in now.');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createAccountFixed(); 