/**
 * Phase 1 Implementation Test Script
 * 
 * This script tests that the database triggers are working correctly
 * by simulating the signup flow and verifying account creation.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testPhase1Implementation() {
  console.log('🧪 Testing Phase 1: Database Triggers Implementation');
  console.log('====================================================\n');

  try {
    // Step 1: Check if trigger exists
    console.log('1️⃣ Checking if trigger exists...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, event_object_table')
      .eq('trigger_name', 'on_auth_user_confirmed');

    if (triggerError) {
      console.error('❌ Error checking triggers:', triggerError.message);
    } else if (triggers && triggers.length > 0) {
      console.log('✅ Trigger exists:', triggers[0]);
    } else {
      console.log('❌ Trigger not found');
      return false;
    }

    // Step 2: Check if function exists
    console.log('\n2️⃣ Checking if function exists...');
    const { data: functions, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_name', 'handle_new_user_signup');

    if (functionError) {
      console.error('❌ Error checking functions:', functionError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ Function exists:', functions[0]);
    } else {
      console.log('❌ Function not found');
      return false;
    }

    // Step 3: Test the trigger function directly
    console.log('\n3️⃣ Testing trigger function directly...');
    const testEmail = `phase1-test-${Date.now()}@example.com`;
    
    try {
      const { data: testResult, error: testError } = await supabase
        .rpc('test_user_signup_trigger', {
          test_email: testEmail,
          test_first_name: 'Phase1',
          test_last_name: 'Test'
        });

      if (testError) {
        console.error('❌ Test function error:', testError.message);
      } else {
        console.log('✅ Test function result:', testResult);
        
        if (testResult.account_created && testResult.account_user_created) {
          console.log('✅ Trigger function working correctly!');
        } else {
          console.log('❌ Trigger function not working correctly');
          return false;
        }
      }
    } catch (err) {
      console.error('❌ Test function failed:', err.message);
      console.log('ℹ️  This might be expected if the test function wasn\'t created');
    }

    // Step 4: Test with real user creation and confirmation
    console.log('\n4️⃣ Testing with real user creation...');
    const realTestEmail = `real-test-${Date.now()}@example.com`;
    
    // Create user with confirmed email (simulating email confirmation)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: realTestEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Real',
        last_name: 'Test'
      }
    });

    if (userError) {
      console.error('❌ Error creating test user:', userError.message);
      return false;
    }

    const userId = userData.user.id;
    console.log('✅ Created test user:', userId);

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if account was created
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', userId)
      .single();

    if (accountError) {
      console.error('❌ Account not created:', accountError.message);
    } else {
      console.log('✅ Account created automatically:', {
        id: account.id,
        email: account.email,
        first_name: account.first_name,
        last_name: account.last_name,
        plan: account.plan
      });
    }

    // Check if account_user was created
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (accountUserError) {
      console.error('❌ Account_user not created:', accountUserError.message);
    } else {
      console.log('✅ Account_user created automatically:', {
        account_id: accountUser.account_id,
        user_id: accountUser.user_id,
        role: accountUser.role
      });
    }

    // Cleanup test user
    console.log('\n🧹 Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('⚠️  Error deleting test user:', deleteError.message);
    } else {
      console.log('✅ Test user cleaned up');
    }

    // Step 5: Verify data integrity
    console.log('\n5️⃣ Checking data integrity...');
    
    // Count confirmed users vs accounts
    const { data: userCount } = await supabase
      .from('auth.users')
      .select('id')
      .not('email_confirmed_at', 'is', null);

    const { data: accountCount } = await supabase
      .from('accounts')
      .select('id');

    console.log('📊 Data integrity check:');
    console.log(`   Confirmed users: ${userCount?.length || 0}`);
    console.log(`   Total accounts: ${accountCount?.length || 0}`);

    // Find orphaned users (confirmed users without accounts)
    const { data: orphanedUsers } = await supabase
      .from('auth.users')
      .select(`
        id, 
        email,
        accounts!left(id)
      `)
      .not('email_confirmed_at', 'is', null)
      .is('accounts.id', null);

    if (orphanedUsers && orphanedUsers.length > 0) {
      console.log('⚠️  Found orphaned users (confirmed but no account):');
      orphanedUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    } else {
      console.log('✅ No orphaned users found');
    }

    console.log('\n🎉 Phase 1 Implementation Test Complete!');
    
    if (account && accountUser) {
      console.log('\n✅ SUCCESS: Database triggers are working correctly!');
      console.log('\nNext steps:');
      console.log('1. Test with a real signup flow on your website');
      console.log('2. Monitor for 24-48 hours to ensure stability');
      console.log('3. Proceed to Phase 2 implementation');
      return true;
    } else {
      console.log('\n❌ FAILURE: Database triggers are not working correctly');
      console.log('\nTroubleshooting:');
      console.log('1. Check if the SQL script was executed completely');
      console.log('2. Verify trigger and function exist (steps 1-2 above)');
      console.log('3. Check database logs for error messages');
      console.log('4. Review the implementation guide');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    return false;
  }
}

async function quickStatusCheck() {
  console.log('🔍 Quick Phase 1 Status Check');
  console.log('==============================\n');

  try {
    // Check basic counts
    const { count: userCount } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact' })
      .not('email_confirmed_at', 'is', null);

    const { count: accountCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact' });

    const { count: accountUserCount } = await supabase
      .from('account_users')
      .select('*', { count: 'exact' });

    console.log('📊 Current state:');
    console.log(`   Confirmed users: ${userCount || 0}`);
    console.log(`   Accounts: ${accountCount || 0}`);
    console.log(`   Account relationships: ${accountUserCount || 0}`);

    if (userCount === accountCount && accountCount === accountUserCount) {
      console.log('\n✅ Data integrity looks good!');
    } else {
      console.log('\n⚠️  Data integrity issues detected');
      console.log('   Run full test for more details');
    }

  } catch (error) {
    console.error('❌ Status check failed:', error.message);
  }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

if (command === 'status') {
  quickStatusCheck();
} else if (command === 'test' || !command) {
  testPhase1Implementation();
} else {
  console.log('Usage: node test-phase1-implementation.js [test|status]');
  console.log('  test   - Run full implementation test (default)');
  console.log('  status - Quick status check');
}