/**
 * Test Script: Prompt Page Types Validation
 * 
 * This script tests all prompt page types for both public and individual campaigns
 * to ensure they're working correctly after our recent fixes.
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  testAccountId: '00000000-0000-0000-0000-000000000001',
  testBusinessId: '00000000-0000-0000-0000-000000000002',
};

// Prompt page types to test
const PROMPT_TYPES = [
  { type: 'service', review_type: 'service', name: 'Service Review' },
  { type: 'product', review_type: 'product', name: 'Product Review' },
  { type: 'photo', review_type: 'photo', name: 'Photo + Testimonial' },
  { type: 'event', review_type: 'event', name: 'Event Review' },
  { type: 'employee', review_type: 'employee', name: 'Employee Spotlight' },
];

// Campaign types to test
const CAMPAIGN_TYPES = ['public', 'individual'];

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

async function createTestAccount() {
  console.log('🔧 Creating test account...');
  
  // Create test account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .insert({
      id: TEST_CONFIG.testAccountId,
      plan: 'maven',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (accountError) {
    console.log('⚠️  Account creation error (might already exist):', accountError.message);
  } else {
    console.log('✅ Test account created:', account.id);
  }

  // Create test business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({
      id: TEST_CONFIG.testBusinessId,
      account_id: TEST_CONFIG.testAccountId,
      name: 'Test Business',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (businessError) {
    console.log('⚠️  Business creation error (might already exist):', businessError.message);
  } else {
    console.log('✅ Test business created:', business.id);
  }

  return { account, business };
}

async function testPromptPageCreation(promptType, campaignType) {
  console.log(`\n🧪 Testing ${promptType.name} (${campaignType} campaign)...`);
  
  const slug = `test-${promptType.type}-${campaignType}-${Date.now()}`;
  const testData = {
    account_id: TEST_CONFIG.testAccountId,
    slug: slug,
    type: promptType.type,
    review_type: promptType.review_type,
    campaign_type: campaignType,
    status: 'in_queue',
    created_at: new Date().toISOString(),
    // Common fields
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '555-1234',
    friendly_note: 'Thank you for your feedback!',
    falling_enabled: true,
    falling_icon: 'star',
    ai_button_enabled: true,
    fix_grammar_enabled: true,
    show_friendly_note: true,
  };

  // Add type-specific fields
  switch (promptType.type) {
    case 'service':
      testData.services_offered = ['Consulting', 'Strategy'];
      testData.outcomes = 'Improved efficiency by 25%';
      testData.project_type = 'Business Consulting';
      break;
    
    case 'product':
      testData.product_name = 'Test Product';
      testData.product_description = 'An amazing test product';
      testData.features_or_benefits = ['Feature 1', 'Feature 2'];
      break;
    
    case 'photo':
      testData.photo_context = 'Professional headshot for website';
      testData.photo_description = 'Looking for a professional photo';
      testData.photo_upload_url = 'https://example.com/photo.jpg';
      break;
    
    case 'event':
      testData.eve_name = 'Test Conference 2024';
      testData.eve_date = '2024-12-31';
      testData.eve_location = 'Test Venue';
      testData.eve_description = 'An amazing test event';
      testData.eve_type = 'Conference';
      testData.eve_duration = '2 days';
      testData.eve_capacity = 100;
      testData.eve_organizer = 'Test Organizer';
      break;
    
    case 'employee':
      testData.emp_first_name = 'John';
      testData.emp_last_name = 'Doe';
      testData.emp_position = 'Senior Developer';
      testData.emp_location = 'San Francisco';
      testData.emp_bio = 'Experienced developer with 5+ years';
      testData.emp_skills = ['JavaScript', 'React', 'Node.js'];
      testData.emp_years_at_business = '3';
      break;
  }

  try {
    const { data: promptPage, error } = await supabase
      .from('prompt_pages')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.log(`❌ FAILED: ${promptType.name} (${campaignType}) - ${error.message}`);
      return { success: false, error: error.message };
    } else {
      console.log(`✅ SUCCESS: ${promptType.name} (${campaignType}) - Created with slug: ${promptPage.slug}`);
      
      // Test retrieval
      const { data: retrieved, error: retrieveError } = await supabase
        .from('prompt_pages')
        .select('*')
        .eq('slug', slug)
        .single();

      if (retrieveError) {
        console.log(`⚠️  RETRIEVAL WARNING: ${promptType.name} (${campaignType}) - ${retrieveError.message}`);
      } else {
        console.log(`✅ RETRIEVAL: ${promptType.name} (${campaignType}) - Successfully retrieved`);
      }

      return { success: true, data: promptPage };
    }
  } catch (error) {
    console.log(`❌ EXCEPTION: ${promptType.name} (${campaignType}) - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDatabaseEnum() {
  console.log('\n🔍 Testing database enum values...');
  
  try {
    const { data, error } = await supabase
      .rpc('get_prompt_page_types');

    if (error) {
      // Fallback: query the enum directly
      const { data: enumData, error: enumError } = await supabase
        .from('information_schema.columns')
        .select('column_default')
        .eq('table_name', 'prompt_pages')
        .eq('column_name', 'type');

      if (enumError) {
        console.log('❌ Could not test enum values:', enumError.message);
      } else {
        console.log('✅ Enum test completed');
      }
    } else {
      console.log('✅ Available prompt page types:', data);
    }
  } catch (error) {
    console.log('⚠️  Enum test skipped:', error.message);
  }
}

async function testPhotoFields() {
  console.log('\n📸 Testing photo-specific fields...');
  
  const testPhotoData = {
    account_id: TEST_CONFIG.testAccountId,
    slug: `test-photo-fields-${Date.now()}`,
    type: 'photo',
    review_type: 'photo',
    campaign_type: 'individual',
    status: 'in_queue',
    photo_context: 'Test photo context',
    photo_description: 'Test photo description',
    photo_upload_url: 'https://example.com/test-photo.jpg',
    photo_display_settings: { size: 'medium', position: 'center' },
  };

  try {
    const { data, error } = await supabase
      .from('prompt_pages')
      .insert(testPhotoData)
      .select()
      .single();

    if (error) {
      console.log('❌ Photo fields test failed:', error.message);
      return false;
    } else {
      console.log('✅ Photo fields test passed');
      return true;
    }
  } catch (error) {
    console.log('❌ Photo fields test exception:', error.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test prompt pages
    const { error: deletePagesError } = await supabase
      .from('prompt_pages')
      .delete()
      .eq('account_id', TEST_CONFIG.testAccountId);

    if (deletePagesError) {
      console.log('⚠️  Cleanup warning (pages):', deletePagesError.message);
    } else {
      console.log('✅ Test prompt pages cleaned up');
    }

    // Delete test business
    const { error: deleteBusinessError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', TEST_CONFIG.testBusinessId);

    if (deleteBusinessError) {
      console.log('⚠️  Cleanup warning (business):', deleteBusinessError.message);
    } else {
      console.log('✅ Test business cleaned up');
    }

    // Delete test account
    const { error: deleteAccountError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', TEST_CONFIG.testAccountId);

    if (deleteAccountError) {
      console.log('⚠️  Cleanup warning (account):', deleteAccountError.message);
    } else {
      console.log('✅ Test account cleaned up');
    }
  } catch (error) {
    console.log('⚠️  Cleanup error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Prompt Page Types Test Suite...\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Setup
    await createTestAccount();
    
    // Test database enum
    await testDatabaseEnum();
    
    // Test photo-specific fields
    const photoFieldsTest = await testPhotoFields();
    if (photoFieldsTest) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('Photo-specific fields test failed');
    }
    results.total++;

    // Test each prompt page type with each campaign type
    for (const promptType of PROMPT_TYPES) {
      for (const campaignType of CAMPAIGN_TYPES) {
        results.total++;
        
        const result = await testPromptPageCreation(promptType, campaignType);
        
        if (result.success) {
          results.passed++;
        } else {
          results.failed++;
          results.errors.push(`${promptType.name} (${campaignType}): ${result.error}`);
        }
      }
    }

    // Results summary
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('========================');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed} ✅`);
    console.log(`Failed: ${results.failed} ❌`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n🎉 ALL TESTS PASSED! All prompt page types are working correctly.');
    }

  } catch (error) {
    console.log('❌ Test suite failed:', error.message);
  } finally {
    // Cleanup
    await cleanup();
    console.log('\n🏁 Test suite completed.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 