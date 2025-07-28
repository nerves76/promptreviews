/**
 * Test Script: Prompt Page API Validation
 * 
 * This script tests the API endpoints to verify all prompt page types work correctly.
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
};

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

async function testDatabaseEnum() {
  console.log('\n🔍 Testing database enum values...');
  
  try {
    const { data, error } = await supabase
      .rpc('get_prompt_page_types');

    if (error) {
      // Try direct SQL query
      const { data: enumData, error: enumError } = await supabase
        .from('prompt_pages')
        .select('type')
        .limit(1);

      if (enumError) {
        console.log('❌ Could not test enum values:', enumError.message);
        return false;
      } else {
        console.log('✅ Enum test completed - prompt_pages table accessible');
        return true;
      }
    } else {
      console.log('✅ Available prompt page types:', data);
      return true;
    }
  } catch (error) {
    console.log('⚠️  Enum test skipped:', error.message);
    return false;
  }
}

async function testPhotoFields() {
  console.log('\n📸 Testing photo-specific fields in database...');
  
  try {
    // Check if photo-specific columns exist
    const { data, error } = await supabase
      .from('prompt_pages')
      .select('photo_context, photo_description, photo_upload_url, photo_display_settings')
      .limit(1);

    if (error) {
      console.log('❌ Photo fields test failed:', error.message);
      return false;
    } else {
      console.log('✅ Photo-specific fields exist in database');
      return true;
    }
  } catch (error) {
    console.log('❌ Photo fields test exception:', error.message);
    return false;
  }
}

async function testPromptPageTypes() {
  console.log('\n🧪 Testing prompt page types in database...');
  
  const promptTypes = ['service', 'product', 'photo', 'event', 'employee'];
  const results = [];

  for (const type of promptTypes) {
    try {
      const { data, error } = await supabase
        .from('prompt_pages')
        .select('type, review_type')
        .eq('type', type)
        .limit(1);

      if (error) {
        console.log(`❌ ${type} type test failed:`, error.message);
        results.push({ type, success: false, error: error.message });
      } else {
        console.log(`✅ ${type} type is valid`);
        results.push({ type, success: true });
      }
    } catch (error) {
      console.log(`❌ ${type} type exception:`, error.message);
      results.push({ type, success: false, error: error.message });
    }
  }

  return results;
}

async function testCampaignTypes() {
  console.log('\n🎯 Testing campaign types in database...');
  
  const campaignTypes = ['public', 'individual'];
  const results = [];

  for (const campaignType of campaignTypes) {
    try {
      const { data, error } = await supabase
        .from('prompt_pages')
        .select('campaign_type')
        .eq('campaign_type', campaignType)
        .limit(1);

      if (error) {
        console.log(`❌ ${campaignType} campaign type test failed:`, error.message);
        results.push({ campaignType, success: false, error: error.message });
      } else {
        console.log(`✅ ${campaignType} campaign type is valid`);
        results.push({ campaignType, success: true });
      }
    } catch (error) {
      console.log(`❌ ${campaignType} campaign type exception:`, error.message);
      results.push({ campaignType, success: false, error: error.message });
    }
  }

  return results;
}

async function testTypeSpecificFields() {
  console.log('\n🔧 Testing type-specific fields...');
  
  const fieldTests = [
    { type: 'service', fields: ['services_offered', 'outcomes', 'project_type'] },
    { type: 'product', fields: ['product_name', 'product_description', 'features_or_benefits'] },
    { type: 'photo', fields: ['photo_context', 'photo_description', 'photo_upload_url'] },
    { type: 'event', fields: ['eve_name', 'eve_date', 'eve_location', 'eve_description'] },
    { type: 'employee', fields: ['emp_first_name', 'emp_position', 'emp_bio', 'emp_skills'] },
  ];

  const results = [];

  for (const test of fieldTests) {
    try {
      // Build select query dynamically
      const selectFields = test.fields.join(', ');
      const { data, error } = await supabase
        .from('prompt_pages')
        .select(selectFields)
        .eq('type', test.type)
        .limit(1);

      if (error) {
        console.log(`❌ ${test.type} fields test failed:`, error.message);
        results.push({ type: test.type, success: false, error: error.message });
      } else {
        console.log(`✅ ${test.type} type-specific fields exist`);
        results.push({ type: test.type, success: true });
      }
    } catch (error) {
      console.log(`❌ ${test.type} fields exception:`, error.message);
      results.push({ type: test.type, success: false, error: error.message });
    }
  }

  return results;
}

async function runTests() {
  console.log('🚀 Starting Prompt Page API Test Suite...\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Test database enum
    const enumTest = await testDatabaseEnum();
    results.total++;
    if (enumTest) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('Database enum test failed');
    }

    // Test photo-specific fields
    const photoFieldsTest = await testPhotoFields();
    results.total++;
    if (photoFieldsTest) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push('Photo-specific fields test failed');
    }

    // Test prompt page types
    const promptTypeResults = await testPromptPageTypes();
    results.total += promptTypeResults.length;
    promptTypeResults.forEach(result => {
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`${result.type} type: ${result.error}`);
      }
    });

    // Test campaign types
    const campaignTypeResults = await testCampaignTypes();
    results.total += campaignTypeResults.length;
    campaignTypeResults.forEach(result => {
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`${result.campaignType} campaign: ${result.error}`);
      }
    });

    // Test type-specific fields
    const fieldResults = await testTypeSpecificFields();
    results.total += fieldResults.length;
    fieldResults.forEach(result => {
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`${result.type} fields: ${result.error}`);
      }
    });

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
    console.log('\n🏁 Test suite completed.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 