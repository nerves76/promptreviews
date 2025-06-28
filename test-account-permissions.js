/**
 * Test Account Permissions and Creation
 * 
 * This script tests the current user's ability to create accounts and account_users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

async function testAccountPermissions() {
  console.log('🔍 Testing account permissions...');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No authenticated user found');
      console.error('User error:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    console.log('📧 User email:', user.email);
    
    // Test 1: Check if account exists
    console.log('\n📊 Test 1: Checking if account exists...');
    const { data: existingAccount, error: accountCheckError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('Account check result:', { 
      exists: !!existingAccount, 
      error: accountCheckError?.message || null 
    });
    
    // Test 2: Try to create account if it doesn't exist
    if (!existingAccount) {
      console.log('\n🆕 Test 2: Attempting to create account...');
      
      const accountData = {
        id: user.id,
        user_id: user.id,
        email: user.email,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        plan: 'NULL',
        has_had_paid_plan: false,
        review_notifications_enabled: true,
      };
      
      const { error: createError } = await supabase
        .from('accounts')
        .insert(accountData);
      
      if (createError) {
        console.error('❌ Account creation failed:', createError);
        console.error('Error details:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        });
      } else {
        console.log('✅ Account created successfully');
      }
    }
    
    // Test 3: Check account_users relationship
    console.log('\n👥 Test 3: Checking account_users relationship...');
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_id', user.id)
      .single();
    
    console.log('Account user check result:', { 
      exists: !!accountUser, 
      error: accountUserError?.message || null 
    });
    
    // Test 4: Try to create account_users if it doesn't exist
    if (!accountUser) {
      console.log('\n🔗 Test 4: Attempting to create account_users relationship...');
      
      const { error: createAccountUserError } = await supabase
        .from('account_users')
        .insert({
          user_id: user.id,
          account_id: user.id,
          role: 'owner'
        });
      
      if (createAccountUserError) {
        console.error('❌ Account user creation failed:', createAccountUserError);
        console.error('Error details:', {
          message: createAccountUserError.message,
          details: createAccountUserError.details,
          hint: createAccountUserError.hint,
          code: createAccountUserError.code
        });
      } else {
        console.log('✅ Account user relationship created successfully');
      }
    }
    
    // Test 5: Check RLS policies
    console.log('\n🔒 Test 5: Checking RLS policies...');
    const { data: rlsInfo, error: rlsError } = await supabase
      .rpc('get_rls_policies', { table_name: 'accounts' })
      .catch(() => ({ data: null, error: { message: 'RPC function not available' } }));
    
    console.log('RLS check result:', { 
      policies: rlsInfo, 
      error: rlsError?.message || null 
    });
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAccountPermissions(); 