#!/usr/bin/env node

/**
 * Auth System Test Runner
 * 
 * Run comprehensive tests on the authentication system
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Test configuration
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Create Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test results storage
const results = [];

// Utility functions
async function cleanupTestUser(email) {
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const testUser = users?.find(u => u.email === email);
    
    if (testUser) {
      // Delete account records first
      await supabase.from('account_users').delete().eq('user_id', testUser.id);
      await supabase.from('accounts').delete().eq('id', testUser.id);
      
      // Then delete user
      await supabase.auth.admin.deleteUser(testUser.id);
      console.log(`🧹 Cleaned up test user: ${email}`);
    }
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
}

async function runTest(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    await testFn();
    results.push({ test: name, status: 'pass' });
    console.log('✅');
    return true;
  } catch (error) {
    results.push({ test: name, status: 'fail', error: error.message });
    console.log(`❌ ${error.message}`);
    return false;
  }
}

// Test functions
async function testSignUp() {
  await cleanupTestUser(TEST_EMAIL);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  
  if (error) throw error;
  if (!data.user) throw new Error('User creation failed');
  return data.user;
}

async function testSignIn() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  
  if (error) throw error;
  if (!data.user) throw new Error('Sign in failed - no user');
  if (!data.session) throw new Error('Sign in failed - no session');
  return data;
}

async function testAccountCreation(userId) {
  // Manually create account since triggers are disabled
  const { error } = await supabase
    .from('accounts')
    .insert({
      id: userId,
      user_id: userId,
      email: TEST_EMAIL,
      plan: 'grower',
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_free_account: false,
    });
  
  if (error && error.code !== '23505') { // Ignore duplicate key error
    throw error;
  }
  
  // Create account_user relationship
  const { error: auError } = await supabase
    .from('account_users')
    .insert({
      user_id: userId,
      account_id: userId,
      role: 'owner',
    });
  
  if (auError && auError.code !== '23505') {
    throw auError;
  }
}

async function testBusinessCreation(accountId) {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      account_id: accountId,
      name: 'Test Business',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
    })
    .select()
    .single();
  
  if (error) throw error;
  if (!data) throw new Error('Business creation failed');
  return data;
}

async function testAdminStatus(userId) {
  const { data, error } = await supabase
    .from('accounts')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data?.is_admin || false;
}

async function testSubscriptionData(userId) {
  const { data, error } = await supabase
    .from('accounts')
    .select('plan, trial_start, trial_end, has_had_paid_plan')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  if (!data) throw new Error('No subscription data');
  return data;
}

async function testSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  
  // Verify session is cleared
  const { data } = await supabase.auth.getSession();
  if (data.session) throw new Error('Session not cleared after sign out');
}

// Main test suite
async function runTestSuite() {
  console.log('🧪 Authentication System Test Suite');
  console.log('=' .repeat(50));
  console.log('Environment:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'localhost');
  console.log('Test Email:', TEST_EMAIL);
  console.log('=' .repeat(50));
  console.log();
  
  let userId = null;
  
  // Run tests
  const user = await runTest('1. Sign Up', testSignUp);
  if (user) userId = user.id;
  
  await runTest('2. Sign In', testSignIn);
  
  if (userId) {
    await runTest('3. Account Creation', () => testAccountCreation(userId));
    await runTest('4. Business Creation', () => testBusinessCreation(userId));
    await runTest('5. Admin Status Check', () => testAdminStatus(userId));
    await runTest('6. Subscription Data', () => testSubscriptionData(userId));
  }
  
  await runTest('7. Sign Out', testSignOut);
  
  // Context structure tests
  await runTest('8. Context Files Exist', () => {
    const fs = require('fs');
    const contexts = [
      'src/auth/context/CoreAuthContext.tsx',
      'src/auth/context/AccountContext.tsx',
      'src/auth/context/BusinessContext.tsx',
      'src/auth/context/AdminContext.tsx',
      'src/auth/context/SubscriptionContext.tsx',
      'src/auth/context/CompositeAuthProvider.tsx',
    ];
    
    for (const ctx of contexts) {
      if (!fs.existsSync(ctx)) {
        throw new Error(`Missing context file: ${ctx}`);
      }
    }
  });
  
  // Print results
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.test}: ${r.error}`);
    });
  }
  
  const percentage = Math.round((passed / total) * 100);
  console.log(`\nSuccess Rate: ${percentage}%`);
  
  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await cleanupTestUser(TEST_EMAIL);
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the test suite
runTestSuite().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});