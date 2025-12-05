/**
 * Test Phase 1 Implementation - Database Triggers
 * Based on login-fix-plan.md test specifications
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPhase1Implementation() {
  console.log('🧪 Testing Phase 1 Implementation');
  console.log('==================================\n');

  try {
    // Step 1: Test the function directly by calling the test function
    console.log('1️⃣ Testing if functions were created...');
    try {
      const { data: testResult, error: testError } = await supabase.rpc('test_handle_new_user');
      
      if (testError) {
        console.error('❌ Test function error:', testError.message);
        console.log('   This means the migration may not have been applied correctly');
        return false;
      } else {
        console.log('✅ Phase 1 functions created successfully');
        console.log('📊 Test result:', testResult);
      }
    } catch (err) {
      console.error('❌ Test function failed:', err.message);
      console.log('   This means the migration may not have been applied correctly');
      return false;
    }

    // Step 2: Test with real user creation and confirmation
    console.log('\n2️⃣ Testing with real user creation...');
    const realTestEmail = `test-${Date.now()}@example.com`;
    
    // Create user with confirmed email (simulating email confirmation)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: realTestEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    });

    if (userError) {
      console.error('❌ Error creating test user:', userError.message);
      return false;
    }

    const userId = userData.user.id;
    console.log('✅ Created test user:', userId);

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

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

    // Step 3: Verify data integrity
    console.log('\n3️⃣ Checking data integrity...');
    
    // Count confirmed users vs accounts
    const { count: userCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Data integrity check:');
    console.log(`   Total accounts: ${userCount || 0}`);

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
    const { count: accountCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact' });

    const { count: accountUserCount } = await supabase
      .from('account_users')
      .select('*', { count: 'exact' });

    console.log('📊 Current state:');
    console.log(`   Accounts: ${accountCount || 0}`);
    console.log(`   Account relationships: ${accountUserCount || 0}`);

    if (accountCount === accountUserCount) {
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

(async () => {
  try {
    if (command === 'status') {
      await quickStatusCheck();
    } else if (command === 'test' || !command) {
      await testPhase1Implementation();
    } else {
      console.log('Usage: node test-phase1-implementation.js [test|status]');
      console.log('  test   - Run full implementation test (default)');
      console.log('  status - Quick status check');
    }
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  }
})(); 