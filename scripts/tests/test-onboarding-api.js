/**
 * Test Onboarding Tasks API Endpoint
 * 
 * Tests the new /api/initialize-onboarding-tasks endpoint to ensure
 * it properly creates default tasks for a user.
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const APP_URL = 'http://localhost:3001';

async function testOnboardingTasksAPI() {
  console.log('🧪 Testing Onboarding Tasks API Endpoint...\n');
  
  const testEmail = `test-onboarding-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  try {
    // 1. Create user via Supabase Auth
    console.log('1️⃣ Creating user via Supabase Auth...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      throw new Error(`Auth signup failed: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log('✅ User created successfully:', userId);

    // 2. Create account via API
    console.log('\n2️⃣ Creating account via /api/create-account...');
    const accountResponse = await fetch(`${APP_URL}/api/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
      }),
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      throw new Error(`Account creation failed: ${accountResponse.status} - ${errorText}`);
    }

    const accountData = await accountResponse.json();
    console.log('✅ Account created successfully:', accountData);

    // 3. Get session for authenticated requests
    console.log('\n3️⃣ Getting user session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (sessionError) {
      throw new Error(`Session creation failed: ${sessionError.message}`);
    }

    const accessToken = sessionData.session.access_token;
    console.log('✅ Session created successfully');

    // 4. Get account ID for the user
    console.log('\n4️⃣ Getting account ID for user...');
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', userId)
      .single();

    if (accountUserError) {
      throw new Error(`Failed to get account ID: ${accountUserError.message}`);
    }

    const accountId = accountUser.account_id;
    console.log('✅ Found account ID:', accountId);

    // 5. Test the onboarding tasks API endpoint
    console.log('\n5️⃣ Testing /api/initialize-onboarding-tasks...');
    
    // First, check if any tasks exist before calling the API
    const { data: existingTasks, error: existingError } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('account_id', accountId);

    if (existingError) {
      throw new Error(`Failed to check existing tasks: ${existingError.message}`);
    }

    console.log(`✅ Found ${existingTasks.length} existing tasks before API call`);

    // Call the onboarding tasks API
    const onboardingResponse = await fetch(`${APP_URL}/api/initialize-onboarding-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!onboardingResponse.ok) {
      const errorText = await onboardingResponse.text();
      throw new Error(`Onboarding tasks API failed: ${onboardingResponse.status} - ${errorText}`);
    }

    const onboardingData = await onboardingResponse.json();
    console.log('✅ Onboarding tasks API response:', onboardingData);

    // 6. Verify tasks were created
    console.log('\n6️⃣ Verifying tasks were created...');
    const { data: newTasks, error: newTasksError } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('account_id', accountId)
      .order('task_id');

    if (newTasksError) {
      throw new Error(`Failed to verify tasks: ${newTasksError.message}`);
    }

    console.log(`✅ Found ${newTasks.length} tasks after API call:`);
    newTasks.forEach(task => {
      console.log(`   - ${task.task_id}: ${task.completed ? 'completed' : 'not completed'}`);
    });

    // 7. Verify all expected tasks exist
    const expectedTasks = [
      'business-profile',
      'style-prompt-pages', 
      'customize-universal',
      'create-prompt-page',
      'share'
    ];

    const foundTaskIds = newTasks.map(task => task.task_id);
    const missingTasks = expectedTasks.filter(taskId => !foundTaskIds.includes(taskId));

    if (missingTasks.length > 0) {
      throw new Error(`Missing expected tasks: ${missingTasks.join(', ')}`);
    }

    console.log('✅ All expected tasks were created successfully');

    // 8. Verify no tasks are completed by default
    const completedTasks = newTasks.filter(task => task.completed);
    if (completedTasks.length > 0) {
      throw new Error(`Expected no tasks to be completed by default, but found ${completedTasks.length} completed tasks`);
    }

    console.log('✅ All tasks are correctly marked as not completed by default');

    console.log('\n🎉 Onboarding tasks API test passed!');
    console.log('\n📋 Test Summary:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Account ID: ${accountId}`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Tasks Created: ${newTasks.length}`);
    console.log(`   Tasks Completed: ${completedTasks.length}`);
    
    return {
      userId,
      accountId,
      email: testEmail,
      taskCount: newTasks.length,
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testOnboardingTasksAPI(); 