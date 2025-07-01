#!/usr/bin/env node

/**
 * Widget System Testing Script
 * Tests widget creation, editing, and embedding functionality
 * 
 * Usage: node scripts/test-widgets.js [test-email]
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Initialize Supabase clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test configuration
const TEST_EMAIL = process.argv[2] || 'widget-test@example.com';
const TEST_PASSWORD = 'test-password-123';
const TEST_FIRST_NAME = 'Widget';
const TEST_LAST_NAME = 'Tester';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(name, passed, details = '') {
  const result = { name, passed, details, timestamp: new Date().toISOString() };
  testResults.tests.push(result);
  if (passed) {
    testResults.passed++;
    log(`PASS: ${name}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${name} - ${details}`, 'error');
  }
}

async function cleanupTestData(userId) {
  try {
    log('🧹 Cleaning up test data...');
    
    // Get account ID for user
    const { data: accountUser } = await supabaseService
      .from('account_users')
      .select('account_id')
      .eq('user_id', userId)
      .single();
    
    if (accountUser) {
      const accountId = accountUser.account_id;
      
      // Delete widgets
      await supabaseService
        .from('widgets')
        .delete()
        .eq('account_id', accountId);
      
      // Delete widget reviews
      await supabaseService
        .from('widget_reviews')
        .delete()
        .eq('widget_id', accountId);
      
      // Delete account_users
      await supabaseService
        .from('account_users')
        .delete()
        .eq('account_id', accountId);
      
      // Delete account
      await supabaseService
        .from('accounts')
        .delete()
        .eq('id', accountId);
    }
    
    // Delete auth user
    const { error: deleteUserError } = await supabaseService.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      log(`Warning: Could not delete auth user: ${deleteUserError.message}`, 'warning');
    }
    
    log('✅ Test data cleanup completed');
  } catch (error) {
    log(`Warning: Cleanup error: ${error.message}`, 'warning');
  }
}

async function testAuthentication() {
  log('🔐 Testing authentication...');
  
  try {
    // Test 1: User signup
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          first_name: TEST_FIRST_NAME,
          last_name: TEST_LAST_NAME
        }
      }
    });
    
    if (signupError) {
      recordTest('User Signup', false, signupError.message);
      return null;
    }
    
    recordTest('User Signup', true);
    
    // Test 2: User signin
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (signinError) {
      recordTest('User Signin', false, signinError.message);
      return null;
    }
    
    recordTest('User Signin', true);
    
    // Test 3: Account creation
    const { data: accountData, error: accountError } = await supabaseService
      .from('accounts')
      .insert({
        id: signinData.user.id, // accounts.id is a foreign key to auth.users(id)
        user_id: signinData.user.id,
        email: TEST_EMAIL,
        first_name: TEST_FIRST_NAME,
        last_name: TEST_LAST_NAME,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0
      })
      .select()
      .single();
    
    if (accountError) {
      recordTest('Account Creation', false, accountError.message);
      return null;
    }
    
    recordTest('Account Creation', true);
    
    // Test 4: Account user relationship
    let accountUserPassed = false;
    let accountUserErrorMsg = '';
    try {
      const { error: accountUserError } = await supabaseService
        .from('account_users')
        .insert({
          account_id: accountData.id,
          user_id: signinData.user.id,
          role: 'owner'
        });
      if (accountUserError) {
        // If duplicate key, treat as pass
        if (accountUserError.message && accountUserError.message.includes('duplicate key value')) {
          accountUserPassed = true;
        } else {
          accountUserErrorMsg = accountUserError.message;
        }
      } else {
        accountUserPassed = true;
      }
    } catch (err) {
      accountUserErrorMsg = err.message;
    }
    recordTest('Account User Relationship', accountUserPassed, accountUserErrorMsg);
    if (!accountUserPassed) {
      return null;
    }
    
    return {
      user: signinData.user,
      account: accountData
    };
    
  } catch (error) {
    recordTest('Authentication Setup', false, error.message);
    return null;
  }
}

async function testWidgetCreation(userData) {
  log('🔧 Testing widget creation...');
  
  try {
    // Test 1: Create multi widget
    const multiWidgetData = {
      account_id: userData.account.id,
      name: 'Test Multi Widget',
      type: 'multi',
      theme: {
        primaryColor: '#4F46E5',
        secondaryColor: '#818CF8',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderRadius: '8px',
        cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: multiWidget, error: multiError } = await supabaseService
      .from('widgets')
      .insert(multiWidgetData)
      .select()
      .single();
    
    if (multiError) {
      recordTest('Multi Widget Creation', false, multiError.message);
      return null;
    }
    
    recordTest('Multi Widget Creation', true);
    
    // Test 2: Create single widget
    const singleWidgetData = {
      account_id: userData.account.id,
      name: 'Test Single Widget',
      type: 'single',
      theme: {
        primaryColor: '#10B981',
        secondaryColor: '#34D399',
        backgroundColor: '#F9FAFB',
        textColor: '#374151',
        borderRadius: '12px',
        cardShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: singleWidget, error: singleError } = await supabaseService
      .from('widgets')
      .insert(singleWidgetData)
      .select()
      .single();
    
    if (singleError) {
      recordTest('Single Widget Creation', false, singleError.message);
      return null;
    }
    
    recordTest('Single Widget Creation', true);
    
    // Test 3: Create photo widget
    const photoWidgetData = {
      account_id: userData.account.id,
      name: 'Test Photo Widget',
      type: 'photo',
      theme: {
        primaryColor: '#F59E0B',
        secondaryColor: '#FBBF24',
        backgroundColor: '#FFFBEB',
        textColor: '#92400E',
        borderRadius: '16px',
        cardShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: photoWidget, error: photoError } = await supabaseService
      .from('widgets')
      .insert(photoWidgetData)
      .select()
      .single();
    
    if (photoError) {
      recordTest('Photo Widget Creation', false, photoError.message);
      return null;
    }
    
    recordTest('Photo Widget Creation', true);
    
    return {
      multiWidget,
      singleWidget,
      photoWidget
    };
    
  } catch (error) {
    recordTest('Widget Creation', false, error.message);
    return null;
  }
}

async function testWidgetRetrieval(userData, widgets) {
  log('📥 Testing widget retrieval...');
  
  try {
    // Test 1: Fetch widgets by account
    const { data: fetchedWidgets, error: fetchError } = await supabaseService
      .from('widgets')
      .select('*')
      .eq('account_id', userData.account.id)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      recordTest('Widget Retrieval', false, fetchError.message);
      return false;
    }
    
    if (!fetchedWidgets || fetchedWidgets.length !== 3) {
      recordTest('Widget Retrieval', false, `Expected 3 widgets, got ${fetchedWidgets?.length || 0}`);
      return false;
    }
    
    recordTest('Widget Retrieval', true);
    
    // Test 2: Fetch specific widget
    const { data: specificWidget, error: specificError } = await supabaseService
      .from('widgets')
      .select('*')
      .eq('id', widgets.multiWidget.id)
      .single();
    
    if (specificError || !specificWidget) {
      recordTest('Specific Widget Retrieval', false, specificError?.message || 'Widget not found');
      return false;
    }
    
    recordTest('Specific Widget Retrieval', true);
    
    return true;
    
  } catch (error) {
    recordTest('Widget Retrieval', false, error.message);
    return false;
  }
}

async function testWidgetEmbedding(widgets) {
  log('🔗 Testing widget embedding...');
  
  try {
    // Test 1: Generate embed codes
    const embedCodes = {
      multi: `<script src="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/widgets/multi/widget-embed.min.js"></script>
<div id="promptreviews-multi-widget" data-widget-id="${widgets.multiWidget.id}"></div>`,
      
      single: `<script src="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/widgets/single/widget-embed.min.js"></script>
<div id="promptreviews-single-widget" data-widget-id="${widgets.singleWidget.id}"></div>`,
      
      photo: `<script src="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/widgets/photo/widget-embed.min.js"></script>
<div id="promptreviews-photo-widget" data-widget-id="${widgets.photoWidget.id}"></div>`
    };
    
    // Test 2: Validate embed code structure
    const embedCodeTests = [
      { name: 'Multi Widget Embed Code', code: embedCodes.multi, expectedId: widgets.multiWidget.id },
      { name: 'Single Widget Embed Code', code: embedCodes.single, expectedId: widgets.singleWidget.id },
      { name: 'Photo Widget Embed Code', code: embedCodes.photo, expectedId: widgets.photoWidget.id }
    ];
    
    for (const test of embedCodeTests) {
      const hasScript = test.code.includes('<script');
      const hasDiv = test.code.includes('<div');
      const hasCorrectId = test.code.includes(test.expectedId);
      const hasCorrectContainer = test.code.includes('promptreviews-');
      
      const passed = hasScript && hasDiv && hasCorrectId && hasCorrectContainer;
      recordTest(test.name, passed, passed ? '' : 'Invalid embed code structure');
    }
    
    // Test 3: Test widget API endpoint (if server is running)
    try {
      const response = await fetch(`http://localhost:3001/api/widgets/${widgets.multiWidget.id}`);
      if (response.ok) {
        const widgetData = await response.json();
        const hasRequiredFields = widgetData.id && widgetData.name && widgetData.type;
        recordTest('Widget API Endpoint', hasRequiredFields, hasRequiredFields ? '' : 'Missing required fields');
      } else {
        recordTest('Widget API Endpoint', false, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (apiError) {
      recordTest('Widget API Endpoint', false, `API not accessible: ${apiError.message}`);
    }
    
    return true;
    
  } catch (error) {
    recordTest('Widget Embedding', false, error.message);
    return false;
  }
}

async function testWidgetUpdates(widgets) {
  log('✏️ Testing widget updates...');
  
  try {
    // Test 1: Update widget name
    const newName = 'Updated Test Widget';
    const { data: updatedWidget, error: updateError } = await supabaseService
      .from('widgets')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', widgets.multiWidget.id)
      .select()
      .single();
    
    if (updateError || !updatedWidget) {
      recordTest('Widget Name Update', false, updateError?.message || 'Update failed');
      return false;
    }
    
    if (updatedWidget.name !== newName) {
      recordTest('Widget Name Update', false, 'Name was not updated correctly');
      return false;
    }
    
    recordTest('Widget Name Update', true);
    
    // Test 2: Update widget theme
    const newTheme = {
      primaryColor: '#DC2626',
      secondaryColor: '#EF4444',
      backgroundColor: '#FEF2F2',
      textColor: '#991B1B',
      borderRadius: '20px',
      cardShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    };
    
    const { data: themeUpdatedWidget, error: themeError } = await supabaseService
      .from('widgets')
      .update({ theme: newTheme, updated_at: new Date().toISOString() })
      .eq('id', widgets.singleWidget.id)
      .select()
      .single();
    
    if (themeError || !themeUpdatedWidget) {
      recordTest('Widget Theme Update', false, themeError?.message || 'Theme update failed');
      return false;
    }
    
    // Compare theme objects properly
    const themeMatches = themeUpdatedWidget.theme && 
      themeUpdatedWidget.theme.primaryColor === newTheme.primaryColor &&
      themeUpdatedWidget.theme.secondaryColor === newTheme.secondaryColor &&
      themeUpdatedWidget.theme.backgroundColor === newTheme.backgroundColor &&
      themeUpdatedWidget.theme.textColor === newTheme.textColor &&
      themeUpdatedWidget.theme.borderRadius === newTheme.borderRadius &&
      themeUpdatedWidget.theme.cardShadow === newTheme.cardShadow;
      
    recordTest('Widget Theme Update', themeMatches, themeMatches ? '' : 'Theme was not updated correctly');
    
    return true;
    
  } catch (error) {
    recordTest('Widget Updates', false, error.message);
    return false;
  }
}

async function testWidgetDeletion(widgets) {
  log('🗑️ Testing widget deletion...');
  
  try {
    // Test 1: Delete single widget
    const { error: deleteError } = await supabaseService
      .from('widgets')
      .delete()
      .eq('id', widgets.singleWidget.id);
    
    if (deleteError) {
      recordTest('Widget Deletion', false, deleteError.message);
      return false;
    }
    
    // Test 2: Verify widget is deleted
    const { data: deletedWidget } = await supabaseService
      .from('widgets')
      .select('*')
      .eq('id', widgets.singleWidget.id)
      .single();
    
    if (deletedWidget) {
      recordTest('Widget Deletion Verification', false, 'Widget still exists after deletion');
      return false;
    }
    
    recordTest('Widget Deletion', true);
    recordTest('Widget Deletion Verification', true);
    
    return true;
    
  } catch (error) {
    recordTest('Widget Deletion', false, error.message);
    return false;
  }
}

async function runTests() {
  log('🚀 Starting Widget System Tests...');
  log(`📧 Using test email: ${TEST_EMAIL}`);
  
  let userData = null;
  let widgets = null;
  
  try {
    // Phase 1: Authentication
    userData = await testAuthentication();
    if (!userData) {
      log('❌ Authentication tests failed, stopping');
      return;
    }
    
    // Phase 2: Widget Creation
    widgets = await testWidgetCreation(userData);
    if (!widgets) {
      log('❌ Widget creation tests failed, stopping');
      return;
    }
    
    // Phase 3: Widget Retrieval
    await testWidgetRetrieval(userData, widgets);
    
    // Phase 4: Widget Embedding
    await testWidgetEmbedding(widgets);
    
    // Phase 5: Widget Updates
    await testWidgetUpdates(widgets);
    
    // Phase 6: Widget Deletion
    await testWidgetDeletion(widgets);
    
  } catch (error) {
    log(`❌ Test execution error: ${error.message}`, 'error');
  } finally {
    // Cleanup
    if (userData?.user?.id) {
      await cleanupTestData(userData.user.id);
    }
    
    // Results
    log('\n📊 Test Results Summary:');
    log(`✅ Passed: ${testResults.passed}`);
    log(`❌ Failed: ${testResults.failed}`);
    log(`📈 Total: ${testResults.passed + testResults.failed}`);
    
    if (testResults.failed > 0) {
      log('\n❌ Failed Tests:');
      testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          log(`  - ${test.name}: ${test.details}`);
        });
    }
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testResults
}; 