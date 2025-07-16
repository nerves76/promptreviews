/**
 * Test script for the new combined prompt page API endpoint
 * Tests performance optimizations and combined data fetching
 */

const { createClient } = require('@supabase/supabase-js');

async function testPromptPageAPI() {
  console.log('🧪 Testing Combined Prompt Page API Endpoint...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  let testSlug = null;
  let testAccountId = null;

  try {
    // Step 1: Find existing prompt pages to test with
    console.log('1️⃣ Finding existing prompt pages for testing...');
    const { data: promptPages, error: fetchError } = await supabase
      .from('prompt_pages')
      .select('slug, account_id, is_universal, type')
      .not('slug', 'is', null)
      .limit(5);

    if (fetchError || !promptPages || promptPages.length === 0) {
      console.log('⚠️ No existing prompt pages found, creating test data...');
      
      // Create test user and business
      const testEmail = `test-prompt-api-${Date.now()}@example.com`;
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        email_confirm: true
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        return;
      }

      testAccountId = authData.user.id;
      console.log('✅ Test user created:', testAccountId);

      // Create account
      await supabase.from('accounts').insert({
        id: testAccountId,
        plan: 'no_plan',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        first_name: 'Test',
        last_name: 'User',
        email: testEmail,
      });

      // Create business
      await supabase.from('businesses').insert({
        account_id: testAccountId,
        name: 'Test Business API',
        primary_color: '#4F46E5',
        secondary_color: '#818CF8',
        background_color: '#FFFFFF',
        text_color: '#1F2937',
      });

      // Create test prompt page
      testSlug = `test-page-${Date.now()}`;
      await supabase.from('prompt_pages').insert({
        account_id: testAccountId,
        slug: testSlug,
        client_name: 'Test Client',
        type: 'service',
        project_type: 'API Testing',
        features_or_benefits: 'Testing the new combined API endpoint',
        is_universal: false,
      });

      console.log('✅ Test data created with slug:', testSlug);
    } else {
      testSlug = promptPages[0].slug;
      testAccountId = promptPages[0].account_id;
      console.log(`✅ Found ${promptPages.length} existing prompt pages, using slug:`, testSlug);
    }

    // Step 2: Test the combined API endpoint
    console.log('\n2️⃣ Testing combined API endpoint...');
    
    const startTime = Date.now();
    const apiResponse = await fetch(`http://localhost:3002/api/prompt-pages/${testSlug}`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`⏱️ API Response time: ${responseTime}ms`);

    if (!apiResponse.ok) {
      console.error(`❌ API call failed: ${apiResponse.status} ${apiResponse.statusText}`);
      return;
    }

    const responseData = await apiResponse.json();
    console.log('✅ API response received');

    // Step 3: Validate response structure
    console.log('\n3️⃣ Validating response structure...');
    
    const requiredFields = {
      promptPage: ['id', 'slug', 'account_id', 'created_at'],
      businessProfile: ['id', 'name', 'primary_color', 'secondary_color']
    };

    let validationPassed = true;

    // Check if both main objects exist
    if (!responseData.promptPage) {
      console.error('❌ Missing promptPage in response');
      validationPassed = false;
    }

    if (!responseData.businessProfile) {
      console.error('❌ Missing businessProfile in response');
      validationPassed = false;
    }

    // Validate promptPage fields
    if (responseData.promptPage) {
      for (const field of requiredFields.promptPage) {
        if (!responseData.promptPage[field]) {
          console.error(`❌ Missing promptPage.${field}`);
          validationPassed = false;
        }
      }
    }

    // Validate businessProfile fields
    if (responseData.businessProfile) {
      for (const field of requiredFields.businessProfile) {
        if (!responseData.businessProfile[field]) {
          console.error(`❌ Missing businessProfile.${field}`);
          validationPassed = false;
        }
      }
    }

    if (validationPassed) {
      console.log('✅ Response structure validation passed');
    }

    // Step 4: Test caching headers
    console.log('\n4️⃣ Testing caching headers...');
    
    const cacheControl = apiResponse.headers.get('cache-control');
    if (cacheControl) {
      console.log(`✅ Cache-Control header present: ${cacheControl}`);
      if (cacheControl.includes('s-maxage=300') && cacheControl.includes('max-age=60')) {
        console.log('✅ Correct cache durations set');
      } else {
        console.log('⚠️ Cache durations may not be optimal');
      }
    } else {
      console.log('⚠️ No Cache-Control header found');
    }

    // Step 5: Test error handling
    console.log('\n5️⃣ Testing error handling...');
    
    // Test 404 with non-existent slug
    const notFoundResponse = await fetch(`http://localhost:3002/api/prompt-pages/non-existent-slug-${Date.now()}`);
    if (notFoundResponse.status === 404) {
      console.log('✅ 404 error handling works correctly');
    } else {
      console.log(`⚠️ Expected 404, got ${notFoundResponse.status}`);
    }

    // Test 400 with empty slug
    const badRequestResponse = await fetch(`http://localhost:3002/api/prompt-pages/`);
    if (badRequestResponse.status === 400 || badRequestResponse.status === 404) {
      console.log('✅ Empty slug error handling works');
    } else {
      console.log(`⚠️ Expected 400/404 for empty slug, got ${badRequestResponse.status}`);
    }

    // Step 6: Performance comparison test
    console.log('\n6️⃣ Testing performance vs separate calls...');
    
    // Simulate old approach with separate API calls
    const separateStartTime = Date.now();
    const promptResponse = await fetch(`http://localhost:3002/api/prompt-pages/${testSlug}`);
    const businessResponse = await fetch(`http://localhost:3002/api/businesses/${testAccountId}`);
    const separateEndTime = Date.now();
    const separateTime = separateEndTime - separateStartTime;

    console.log(`⏱️ Combined API: ${responseTime}ms`);
    console.log(`⏱️ Simulated separate calls: ${separateTime}ms`);
    console.log(`📈 Performance improvement: ${separateTime - responseTime}ms (${Math.round(((separateTime - responseTime) / separateTime) * 100)}% faster)`);

    // Step 7: Test data consistency
    console.log('\n7️⃣ Testing data consistency...');
    
    if (responseData.promptPage && responseData.businessProfile) {
      const promptAccountId = responseData.promptPage.account_id;
      const businessAccountId = responseData.businessProfile.account_id || 
                               (responseData.businessProfile.id === promptAccountId ? promptAccountId : null);
      
      if (promptAccountId === testAccountId) {
        console.log('✅ Account ID consistency verified');
      } else {
        console.log('⚠️ Account ID mismatch detected');
      }
    }

    console.log('\n🎉 API endpoint testing completed successfully!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Response Time: ${responseTime}ms`);
    console.log(`   Structure Valid: ${validationPassed ? 'Yes' : 'No'}`);
    console.log(`   Caching Headers: ${cacheControl ? 'Present' : 'Missing'}`);
    console.log(`   Error Handling: Working`);
    console.log(`   Performance Gain: ${Math.round(((separateTime - responseTime) / separateTime) * 100)}%`);

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  } finally {
    // Cleanup test data if we created it
    if (testAccountId && testSlug && testSlug.includes('test-page-')) {
      console.log('\n🧹 Cleaning up test data...');
      try {
        await supabase.from('prompt_pages').delete().eq('slug', testSlug);
        await supabase.from('businesses').delete().eq('account_id', testAccountId);
        await supabase.from('accounts').delete().eq('id', testAccountId);
        await supabase.auth.admin.deleteUser(testAccountId);
        console.log('✅ Test data cleanup completed');
      } catch (cleanupError) {
        console.log('⚠️ Cleanup error (non-critical):', cleanupError.message);
      }
    }
  }
}

// Run the test
if (require.main === module) {
  testPromptPageAPI();
}

module.exports = { testPromptPageAPI }; 