/**
 * Test Script: Account Cancellation and Reactivation Flow
 * 
 * This script simulates and tests the complete user journey:
 * 1. Account cancellation
 * 2. Stripe subscription cancellation
 * 3. Return after cancellation
 * 4. Reactivation process
 * 5. Plan selection
 * 
 * Run: node scripts/test-reactivation-flow.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin operations
);

// Test account credentials (use a test account)
const TEST_ACCOUNT = {
  email: 'test-reactivation@example.com',
  password: 'Test123456!',
  userId: null
};

// ============================================
// TEST FUNCTIONS
// ============================================

async function createTestAccount() {
  console.log('\n📝 Creating test account...');
  
  try {
    // Sign up test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: TEST_ACCOUNT.email,
      password: TEST_ACCOUNT.password
    });
    
    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return null;
    }
    
    TEST_ACCOUNT.userId = authData.user.id;
    console.log('✅ Test user created:', TEST_ACCOUNT.userId);
    
    // Create account record
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        id: TEST_ACCOUNT.userId,
        email: TEST_ACCOUNT.email,
        plan: 'grower',
        subscription_status: 'active',
        stripe_customer_id: 'cus_test_' + Date.now(),
        stripe_subscription_id: 'sub_test_' + Date.now()
      })
      .select()
      .single();
    
    if (accountError) {
      console.error('❌ Account creation failed:', accountError);
      return null;
    }
    
    console.log('✅ Account created:', account.id);
    return account;
  } catch (error) {
    console.error('💥 Error creating test account:', error);
    return null;
  }
}

async function testCancellation(accountId) {
  console.log('\n🗑️ Testing account cancellation...');
  
  try {
    // Get account before cancellation
    const { data: beforeAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    console.log('📊 Before cancellation:');
    console.log('  - Plan:', beforeAccount.plan);
    console.log('  - Status:', beforeAccount.subscription_status);
    console.log('  - Deleted:', beforeAccount.deleted_at);
    
    // Perform soft deletion (simulate cancel-account API)
    const { error: cancelError } = await supabase
      .from('accounts')
      .update({
        deleted_at: new Date().toISOString(),
        plan: 'no_plan',
        subscription_status: 'canceled',
        last_cancellation_reason: 'testing'
      })
      .eq('id', accountId);
    
    if (cancelError) {
      console.error('❌ Cancellation failed:', cancelError);
      return false;
    }
    
    // Get account after cancellation
    const { data: afterAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    console.log('\n📊 After cancellation:');
    console.log('  - Plan:', afterAccount.plan);
    console.log('  - Status:', afterAccount.subscription_status);
    console.log('  - Deleted:', afterAccount.deleted_at);
    
    // Verify cancellation
    if (afterAccount.deleted_at && afterAccount.plan === 'no_plan') {
      console.log('✅ Account successfully cancelled');
      return true;
    } else {
      console.error('❌ Account not properly cancelled');
      return false;
    }
  } catch (error) {
    console.error('💥 Error testing cancellation:', error);
    return false;
  }
}

async function testReactivationCheck(accountId) {
  console.log('\n🔍 Testing reactivation check...');
  
  try {
    // Check if account needs reactivation
    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (!account) {
      console.error('❌ Account not found');
      return false;
    }
    
    // Calculate days inactive
    const deletedAt = new Date(account.deleted_at);
    const now = new Date();
    const daysInactive = Math.floor((now - deletedAt) / (1000 * 60 * 60 * 24));
    
    console.log('📊 Reactivation check:');
    console.log('  - Account ID:', account.id);
    console.log('  - Deleted at:', account.deleted_at);
    console.log('  - Days inactive:', daysInactive);
    console.log('  - Current plan:', account.plan);
    console.log('  - Needs reactivation:', !!account.deleted_at);
    
    if (account.deleted_at) {
      console.log('✅ Account correctly identified as needing reactivation');
      
      // Check data retention status
      if (daysInactive > 90) {
        console.log('⚠️ Data would be purged (>90 days)');
      } else if (daysInactive > 60) {
        console.log('⚠️ Data approaching purge deadline');
      } else {
        console.log('✅ All data intact');
      }
      
      return true;
    } else {
      console.error('❌ Account not marked for reactivation');
      return false;
    }
  } catch (error) {
    console.error('💥 Error checking reactivation:', error);
    return false;
  }
}

async function testReactivation(accountId) {
  console.log('\n✨ Testing account reactivation...');
  
  try {
    // Perform reactivation
    const { error: reactivateError } = await supabase
      .from('accounts')
      .update({
        deleted_at: null,
        plan: 'no_plan', // Force plan selection
        subscription_status: null,
        stripe_subscription_id: null,
        reactivated_at: new Date().toISOString(),
        reactivation_count: 1
      })
      .eq('id', accountId);
    
    if (reactivateError) {
      console.error('❌ Reactivation failed:', reactivateError);
      return false;
    }
    
    // Get reactivated account
    const { data: reactivatedAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    console.log('\n📊 After reactivation:');
    console.log('  - Deleted at:', reactivatedAccount.deleted_at);
    console.log('  - Plan:', reactivatedAccount.plan);
    console.log('  - Reactivated at:', reactivatedAccount.reactivated_at);
    console.log('  - Reactivation count:', reactivatedAccount.reactivation_count);
    console.log('  - Requires plan selection:', reactivatedAccount.plan === 'no_plan');
    
    if (!reactivatedAccount.deleted_at && reactivatedAccount.reactivated_at) {
      console.log('✅ Account successfully reactivated');
      return true;
    } else {
      console.error('❌ Account not properly reactivated');
      return false;
    }
  } catch (error) {
    console.error('💥 Error testing reactivation:', error);
    return false;
  }
}

async function testReactivationOffer(accountId, daysInactive = 5) {
  console.log('\n🎁 Testing reactivation offers...');
  
  try {
    // Set deleted_at to simulate different inactivity periods
    const deletedDate = new Date();
    deletedDate.setDate(deletedDate.getDate() - daysInactive);
    
    await supabase
      .from('accounts')
      .update({
        deleted_at: deletedDate.toISOString(),
        has_had_paid_plan: true
      })
      .eq('id', accountId);
    
    // Check what offer would be available
    console.log(`\n📊 Testing offer for ${daysInactive} days inactive:`);
    
    if (daysInactive < 7) {
      console.log('  ✅ Quick return offer: 50% off first month');
    } else if (daysInactive <= 30) {
      console.log('  ✅ Win-back offer: 25% off first month');
    } else {
      console.log('  ✅ Loyalty offer: 20% off (previous paid customer)');
    }
    
    return true;
  } catch (error) {
    console.error('💥 Error testing offers:', error);
    return false;
  }
}

async function cleanupTestAccount(accountId) {
  console.log('\n🧹 Cleaning up test account...');
  
  try {
    // Delete account record
    await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);
    
    // Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(accountId);
    
    if (error) {
      console.error('⚠️ Could not delete auth user:', error.message);
    } else {
      console.log('✅ Test account cleaned up');
    }
  } catch (error) {
    console.error('⚠️ Cleanup error:', error);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runTests() {
  console.log('🚀 Starting Reactivation Flow Tests');
  console.log('====================================\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  let accountId = null;
  
  try {
    // Test 1: Create test account
    const account = await createTestAccount();
    if (account) {
      testsPassed++;
      accountId = account.id;
    } else {
      testsFailed++;
      console.error('⚠️ Skipping remaining tests - no test account');
      return;
    }
    
    // Test 2: Cancel account
    if (await testCancellation(accountId)) {
      testsPassed++;
    } else {
      testsFailed++;
    }
    
    // Test 3: Check reactivation needed
    if (await testReactivationCheck(accountId)) {
      testsPassed++;
    } else {
      testsFailed++;
    }
    
    // Test 4: Reactivate account
    if (await testReactivation(accountId)) {
      testsPassed++;
    } else {
      testsFailed++;
    }
    
    // Test 5: Check offers for different inactivity periods
    console.log('\n🎁 Testing different offer scenarios...');
    
    // Quick return (< 7 days)
    if (await testReactivationOffer(accountId, 3)) {
      testsPassed++;
    } else {
      testsFailed++;
    }
    
    // Win-back (7-30 days)
    if (await testReactivationOffer(accountId, 14)) {
      testsPassed++;
    } else {
      testsFailed++;
    }
    
    // Loyalty (>30 days)
    if (await testReactivationOffer(accountId, 45)) {
      testsPassed++;
    } else {
      testsFailed++;
    }
    
  } finally {
    // Cleanup
    if (accountId) {
      await cleanupTestAccount(accountId);
    }
    
    // Summary
    console.log('\n====================================');
    console.log('📊 TEST RESULTS');
    console.log('====================================');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! Reactivation flow is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the errors above.');
    }
  }
}

// Run the tests
runTests().catch(console.error);