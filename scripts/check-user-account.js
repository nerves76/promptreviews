/**
 * Check and fix user account creation
 * 
 * This script checks if a user has proper account records and creates them if missing.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixUserAccount() {
  try {
    const userId = 'ca6318e5-c45d-445c-b0fa-8c67de5577c3'; // Your user ID from the error
    
    console.log('🔍 Checking account for user:', userId);
    
    // Check if account exists
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (accountError && accountError.code !== 'PGRST116') {
      console.error('❌ Error checking account:', accountError);
      return;
    }
    
    if (!account) {
      console.log('📝 Creating account for user...');
      
      // Get user details from auth
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('❌ Error getting user:', userError);
        return;
      }
      
      if (!user) {
        console.error('❌ User not found in auth');
        return;
      }
      
      // Create account
      const { error: createAccountError } = await supabaseAdmin
        .from('accounts')
        .insert({
          id: userId,
          user_id: userId,
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
        });
      
      if (createAccountError) {
        console.error('❌ Error creating account:', createAccountError);
        return;
      }
      
      console.log('✅ Account created successfully');
    } else {
      console.log('✅ Account already exists');
    }
    
    // Check if account_users record exists
    const { data: accountUser, error: accountUserError } = await supabaseAdmin
      .from('account_users')
      .select('*')
      .eq('user_id', userId)
      .eq('account_id', userId)
      .single();
    
    if (accountUserError && accountUserError.code !== 'PGRST116') {
      console.error('❌ Error checking account_users:', accountUserError);
      return;
    }
    
    if (!accountUser) {
      console.log('📝 Creating account_users record...');
      
      const { error: createAccountUserError } = await supabaseAdmin
        .from('account_users')
        .insert({
          user_id: userId,
          account_id: userId,
          role: 'owner',
        });
      
      if (createAccountUserError) {
        console.error('❌ Error creating account_users:', createAccountUserError);
        return;
      }
      
      console.log('✅ Account users record created successfully');
    } else {
      console.log('✅ Account users record already exists');
    }
    
    console.log('🎉 User account setup complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndFixUserAccount(); 