/**
 * Fix Account RLS Issues
 * 
 * This script disables RLS on accounts and account_users tables
 * to allow account creation during development
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAccountRLS() {
  console.log('🔧 Fixing account RLS issues...');
  
  try {
    // Disable RLS on accounts table
    console.log('📋 Disabling RLS on accounts table...');
    const { error: accountsError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;' 
      });
    
    if (accountsError) {
      console.error('❌ Error disabling RLS on accounts:', accountsError);
    } else {
      console.log('✅ RLS disabled on accounts table');
    }

    // Disable RLS on account_users table
    console.log('📋 Disabling RLS on account_users table...');
    const { error: accountUsersError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE public.account_users DISABLE ROW LEVEL SECURITY;' 
      });
    
    if (accountUsersError) {
      console.error('❌ Error disabling RLS on account_users:', accountUsersError);
    } else {
      console.log('✅ RLS disabled on account_users table');
    }

    // Verify RLS is disabled
    console.log('🔍 Verifying RLS status...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity
          FROM pg_tables 
          WHERE tablename IN ('accounts', 'account_users')
            AND schemaname = 'public';
        ` 
      });
    
    if (rlsError) {
      console.error('❌ Error checking RLS status:', rlsError);
    } else {
      console.log('📊 RLS Status:', rlsStatus);
    }

    console.log('✅ Account RLS fix completed');
    
  } catch (error) {
    console.error('❌ Fix failed with error:', error);
  }
}

fixAccountRLS(); 