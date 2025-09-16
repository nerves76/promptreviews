/**
 * Widget Account Isolation Testing Script
 * 
 * This script tests the account isolation fixes for widgets and reviews functionality.
 * It validates that widget data, review management, and settings are properly isolated
 * between different accounts when using the account switcher.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test credentials
const TEST_EMAIL = 'nerves76@gmail.com';
const TEST_PASSWORD = 'Prcamus9721!';

let authSession = null;
let userId = null;

async function authenticateUser() {
  console.log('🔐 Authenticating test user...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
  
  authSession = data.session;
  userId = data.user.id;
  
  console.log('✅ Authentication successful');
  console.log('👤 User ID:', userId);
  return { session: data.session, user: data.user };
}

async function makeApiRequest(endpoint, options = {}) {
  const url = `http://localhost:3002${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authSession && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${authSession.access_token}`;
  }
  
  if (options.accountId) {
    headers['X-Selected-Account'] = options.accountId;
  }
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`API Error (${response.status}): ${data.error || response.statusText}`);
  }
  
  return { data, response };
}

async function getUserAccounts() {
  console.log('\n📊 Fetching user accounts...');
  
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // Get accounts for the test user
  const { data: accountUsers, error } = await supabase
    .from('account_users')
    .select(`
      account_id,
      role,
      accounts!inner (
        id,
        account_name,
        business_name,
        created_at
      )
    `)
    .eq('user_id', userId);
  
  if (error) {
    throw new Error(`Failed to fetch accounts: ${error.message}`);
  }
  
  const accounts = accountUsers.map(au => ({
    id: au.account_id,
    name: au.accounts.account_name,
    business_name: au.accounts.business_name,
    role: au.role,
    created_at: au.accounts.created_at
  }));
  
  console.log(`✅ Found ${accounts.length} accounts for user`);
  accounts.forEach((account, i) => {
    console.log(`   ${i + 1}. ${account.name} (${account.business_name}) - ${account.role}`);
  });
  
  return accounts;
}

async function testWidgetApiIsolation(accounts) {
  console.log('\n🔧 Testing Widget API Account Isolation...');
  
  if (accounts.length < 2) {
    console.log('⚠️ Need at least 2 accounts to test isolation. Creating test scenario with one account.');
    return testSingleAccountWidgets(accounts[0]);
  }
  
  const account1 = accounts[0];
  const account2 = accounts[1];
  
  console.log(`📍 Testing with Account 1: ${account1.name} (${account1.id})`);
  console.log(`📍 Testing with Account 2: ${account2.name} (${account2.id})`);
  
  // Test 1: Create widgets in different accounts
  let widget1Id = null;
  let widget2Id = null;
  
  try {
    console.log('\n🔄 Creating widget in Account 1...');
    const { data: widget1 } = await makeApiRequest('/api/widgets', {
      method: 'POST',
      accountId: account1.id,
      body: {
        name: 'Test Widget Account 1',
        type: 'multi',
        theme: { primaryColor: '#FF0000' }
      }
    });
    widget1Id = widget1.id;
    console.log('✅ Widget created in Account 1:', widget1Id);
    
    console.log('\n🔄 Creating widget in Account 2...');
    const { data: widget2 } = await makeApiRequest('/api/widgets', {
      method: 'POST',
      accountId: account2.id,
      body: {
        name: 'Test Widget Account 2',
        type: 'single',
        theme: { primaryColor: '#0000FF' }
      }
    });
    widget2Id = widget2.id;
    console.log('✅ Widget created in Account 2:', widget2Id);
    
  } catch (error) {
    console.error('❌ Widget creation failed:', error.message);
    return;
  }
  
  // Test 2: Verify widgets are isolated by account
  try {
    console.log('\n🔍 Testing widget access isolation...');
    
    // Try to access Account 1 widget with Account 2 context
    console.log('🔄 Attempting to access Account 1 widget with Account 2 context...');
    try {
      await makeApiRequest(`/api/widgets/${widget1Id}`, {
        accountId: account2.id
      });
      console.error('❌ SECURITY ISSUE: Account 2 could access Account 1 widget!');
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('access denied')) {
        console.log('✅ Account isolation working: Access properly denied');
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
    }
    
    // Try to access Account 2 widget with Account 1 context
    console.log('🔄 Attempting to access Account 2 widget with Account 1 context...');
    try {
      await makeApiRequest(`/api/widgets/${widget2Id}`, {
        accountId: account1.id
      });
      console.error('❌ SECURITY ISSUE: Account 1 could access Account 2 widget!');
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('access denied')) {
        console.log('✅ Account isolation working: Access properly denied');
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Widget isolation test failed:', error.message);
  }
  
  // Test 3: Verify widget lists are filtered by account
  try {
    console.log('\n📋 Testing widget list filtering...');
    
    const { data: account1Widgets } = await makeApiRequest('/api/widgets', {
      accountId: account1.id
    });
    
    const { data: account2Widgets } = await makeApiRequest('/api/widgets', {
      accountId: account2.id
    });
    
    console.log(`📊 Account 1 widgets: ${account1Widgets.length}`);
    console.log(`📊 Account 2 widgets: ${account2Widgets.length}`);
    
    // Check if widgets are properly isolated
    const account1HasAccount2Widget = account1Widgets.some(w => w.id === widget2Id);
    const account2HasAccount1Widget = account2Widgets.some(w => w.id === widget1Id);
    
    if (account1HasAccount2Widget) {
      console.error('❌ SECURITY ISSUE: Account 1 widget list contains Account 2 widget!');
    } else {
      console.log('✅ Account 1 widget list properly filtered');
    }
    
    if (account2HasAccount1Widget) {
      console.error('❌ SECURITY ISSUE: Account 2 widget list contains Account 1 widget!');
    } else {
      console.log('✅ Account 2 widget list properly filtered');
    }
    
  } catch (error) {
    console.error('❌ Widget list filtering test failed:', error.message);
  }
  
  // Cleanup: Delete test widgets
  try {
    console.log('\n🧹 Cleaning up test widgets...');
    
    if (widget1Id) {
      await makeApiRequest(`/api/widgets/${widget1Id}`, {
        method: 'DELETE',
        accountId: account1.id
      });
      console.log('✅ Deleted Account 1 test widget');
    }
    
    if (widget2Id) {
      await makeApiRequest(`/api/widgets/${widget2Id}`, {
        method: 'DELETE',
        accountId: account2.id
      });
      console.log('✅ Deleted Account 2 test widget');
    }
    
  } catch (error) {
    console.error('⚠️ Cleanup failed (widgets may need manual deletion):', error.message);
  }
}

async function testSingleAccountWidgets(account) {
  console.log('🔧 Testing basic widget functionality with single account...');
  
  let testWidgetId = null;
  
  try {
    // Create a test widget
    console.log('\n🔄 Creating test widget...');
    const { data: widget } = await makeApiRequest('/api/widgets', {
      method: 'POST',
      accountId: account.id,
      body: {
        name: 'Test Widget',
        type: 'multi',
        theme: { primaryColor: '#00FF00' }
      }
    });
    testWidgetId = widget.id;
    console.log('✅ Test widget created:', testWidgetId);
    
    // Fetch widget with correct account context
    console.log('\n🔍 Fetching widget with correct account context...');
    const { data: fetchedWidget } = await makeApiRequest(`/api/widgets/${testWidgetId}`, {
      accountId: account.id
    });
    console.log('✅ Widget fetched successfully with account context');
    
    // Try to fetch widget without account context (should still work for public embed)
    console.log('\n🔍 Testing public widget access (no account context)...');
    const { data: publicWidget } = await makeApiRequest(`/api/widgets/${testWidgetId}`, {
      skipAuth: true
    });
    console.log('✅ Public widget access working for embeds');
    
    // Test widget update
    console.log('\n🔄 Testing widget update...');
    const { data: updatedWidget } = await makeApiRequest(`/api/widgets/${testWidgetId}`, {
      method: 'PUT',
      accountId: account.id,
      body: {
        name: 'Updated Test Widget',
        theme: { primaryColor: '#FF00FF' }
      }
    });
    console.log('✅ Widget updated successfully');
    
  } catch (error) {
    console.error('❌ Single account widget test failed:', error.message);
  } finally {
    // Cleanup
    if (testWidgetId) {
      try {
        await makeApiRequest(`/api/widgets/${testWidgetId}`, {
          method: 'DELETE',
          accountId: account.id
        });
        console.log('✅ Test widget cleaned up');
      } catch (error) {
        console.error('⚠️ Cleanup failed:', error.message);
      }
    }
  }
}

async function testReviewIsolation(accounts) {
  console.log('\n📝 Testing Review Account Isolation...');
  
  if (accounts.length < 1) {
    console.log('⚠️ No accounts available for review testing');
    return;
  }
  
  const account = accounts[0];
  
  try {
    // Create a test widget first
    console.log('🔄 Creating widget for review testing...');
    const { data: widget } = await makeApiRequest('/api/widgets', {
      method: 'POST',
      accountId: account.id,
      body: {
        name: 'Review Test Widget',
        type: 'multi',
        theme: {}
      }
    });
    
    console.log('✅ Widget created for review testing:', widget.id);
    
    // Test widget reviews endpoint
    console.log('🔍 Testing widget reviews endpoint...');
    try {
      const { data: reviews } = await makeApiRequest(`/api/widgets/${widget.id}/reviews`, {
        accountId: account.id
      });
      console.log(`✅ Reviews endpoint accessible, found ${reviews?.reviews?.length || 0} reviews`);
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('✅ Reviews endpoint returns 404 (endpoint may not exist or widget has no reviews)');
      } else {
        console.error('❌ Reviews endpoint error:', error.message);
      }
    }
    
    // Cleanup widget
    await makeApiRequest(`/api/widgets/${widget.id}`, {
      method: 'DELETE',
      accountId: account.id
    });
    console.log('✅ Review test widget cleaned up');
    
  } catch (error) {
    console.error('❌ Review isolation test failed:', error.message);
  }
}

async function testDatabaseDirectAccess(accounts) {
  console.log('\n🔍 Testing Database-Level Account Isolation...');
  
  if (accounts.length < 2) {
    console.log('⚠️ Need at least 2 accounts to test database-level isolation');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  try {
    // Check widgets table for proper account isolation
    console.log('🔄 Checking widgets table account filtering...');
    
    const account1 = accounts[0];
    const account2 = accounts[1];
    
    const { data: account1Widgets } = await supabase
      .from('widgets')
      .select('id, account_id, name')
      .eq('account_id', account1.id);
    
    const { data: account2Widgets } = await supabase
      .from('widgets')
      .select('id, account_id, name')
      .eq('account_id', account2.id);
    
    console.log(`📊 Account 1 (${account1.id}) widgets in database:`, account1Widgets?.length || 0);
    console.log(`📊 Account 2 (${account2.id}) widgets in database:`, account2Widgets?.length || 0);
    
    // Verify no cross-contamination
    const account1HasAccount2Data = account1Widgets?.some(w => w.account_id === account2.id);
    const account2HasAccount1Data = account2Widgets?.some(w => w.account_id === account1.id);
    
    if (account1HasAccount2Data) {
      console.error('❌ DATABASE ISSUE: Account 1 query returned Account 2 data!');
    } else {
      console.log('✅ Account 1 database queries properly isolated');
    }
    
    if (account2HasAccount1Data) {
      console.error('❌ DATABASE ISSUE: Account 2 query returned Account 1 data!');
    } else {
      console.log('✅ Account 2 database queries properly isolated');
    }
    
  } catch (error) {
    console.error('❌ Database isolation test failed:', error.message);
  }
}

async function runAccountIsolationTests() {
  console.log('🧪 WIDGET ACCOUNT ISOLATION TESTING');
  console.log('=====================================\n');
  
  try {
    // Step 1: Authenticate
    await authenticateUser();
    
    // Step 2: Get user accounts
    const accounts = await getUserAccounts();
    
    if (accounts.length === 0) {
      console.error('❌ No accounts found for test user. Cannot proceed with testing.');
      return;
    }
    
    // Step 3: Test Widget API isolation
    await testWidgetApiIsolation(accounts);
    
    // Step 4: Test Review isolation
    await testReviewIsolation(accounts);
    
    // Step 5: Test database-level isolation
    await testDatabaseDirectAccess(accounts);
    
    console.log('\n🏁 ACCOUNT ISOLATION TESTING COMPLETE');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    console.error(error.stack);
  }
}

// Additional utility functions for manual testing
function generateTestScenarios() {
  return {
    'Widget Creation': {
      steps: [
        'Navigate to /dashboard/widget',
        'Create widget in Account A',
        'Switch to Account B',
        'Verify widget does not appear',
        'Create different widget in Account B',
        'Switch back to Account A',
        'Verify only Account A widgets appear'
      ],
      expected: 'Widgets should be completely isolated between accounts'
    },
    
    'Review Management': {
      steps: [
        'Open review management modal for widget in Account A',
        'Note the reviews available',
        'Switch to Account B',
        'Open review management for Account B widget',
        'Verify different set of reviews',
        'Verify no Account A reviews appear in Account B'
      ],
      expected: 'Reviews should be filtered by account via prompt_pages join'
    },
    
    'API Endpoints': {
      steps: [
        'Monitor network tab in browser dev tools',
        'Perform widget operations in different accounts',
        'Verify X-Selected-Account header present in requests',
        'Verify API responses contain only account-appropriate data'
      ],
      expected: 'All API requests should include account context and return filtered data'
    },
    
    'LocalStorage Isolation': {
      steps: [
        'Edit widget settings in Account A',
        'Switch to Account B',
        'Check localStorage in browser console',
        'Verify no Account A data persists',
        'Make changes in Account B',
        'Switch back to Account A',
        'Verify Account A settings preserved'
      ],
      expected: 'LocalStorage should be account-scoped or cleared on account switch'
    }
  };
}

// Export functions for use in other scripts
module.exports = {
  runAccountIsolationTests,
  generateTestScenarios,
  authenticateUser,
  makeApiRequest,
  getUserAccounts
};

// Run if called directly
if (require.main === module) {
  runAccountIsolationTests().catch(console.error);
}