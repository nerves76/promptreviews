/**
 * Test Script: UI Routing Validation
 * 
 * This script tests the UI routing to ensure all prompt page types
 * can be accessed via the web interface.
 */

const http = require('http');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3002',
  timeout: 5000,
};

const PROMPT_TYPES = [
  { type: 'service', name: 'Service Review' },
  { type: 'product', name: 'Product Review' },
  { type: 'photo', name: 'Photo + Testimonial' },
  { type: 'event', name: 'Event Review' },
  { type: 'employee', name: 'Employee Spotlight' },
];

const CAMPAIGN_TYPES = ['public', 'individual'];

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'GET',
      timeout: TEST_CONFIG.timeout,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testPromptPageRoutes() {
  console.log('🧪 Testing prompt page routes...\n');
  
  const results = [];

  for (const promptType of PROMPT_TYPES) {
    for (const campaignType of CAMPAIGN_TYPES) {
      const path = `/create-prompt-page?type=${promptType.type}&campaign_type=${campaignType}`;
      
      try {
        console.log(`Testing: ${promptType.name} (${campaignType})`);
        const response = await makeRequest(path);
        
        if (response.statusCode === 200) {
          console.log(`✅ SUCCESS: ${promptType.name} (${campaignType}) - Status: ${response.statusCode}`);
          results.push({
            type: promptType.type,
            campaign: campaignType,
            success: true,
            statusCode: response.statusCode
          });
        } else {
          console.log(`❌ FAILED: ${promptType.name} (${campaignType}) - Status: ${response.statusCode}`);
          results.push({
            type: promptType.type,
            campaign: campaignType,
            success: false,
            statusCode: response.statusCode
          });
        }
      } catch (error) {
        console.log(`❌ ERROR: ${promptType.name} (${campaignType}) - ${error.message}`);
        results.push({
          type: promptType.type,
          campaign: campaignType,
          success: false,
          error: error.message
        });
      }
    }
  }

  return results;
}

async function testPromptPagesList() {
  console.log('\n📋 Testing prompt pages list routes...\n');
  
  const routes = [
    { path: '/prompt-pages', name: 'Public Prompt Pages' },
    { path: '/prompt-pages/individual', name: 'Individual Prompt Pages' },
  ];

  const results = [];

  for (const route of routes) {
    try {
      console.log(`Testing: ${route.name}`);
      const response = await makeRequest(route.path);
      
      if (response.statusCode === 200) {
        console.log(`✅ SUCCESS: ${route.name} - Status: ${response.statusCode}`);
        results.push({
          route: route.name,
          success: true,
          statusCode: response.statusCode
        });
      } else {
        console.log(`❌ FAILED: ${route.name} - Status: ${response.statusCode}`);
        results.push({
          route: route.name,
          success: false,
          statusCode: response.statusCode
        });
      }
    } catch (error) {
      console.log(`❌ ERROR: ${route.name} - ${error.message}`);
      results.push({
        route: route.name,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

async function runTests() {
  console.log('🚀 Starting UI Routing Test Suite...\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Test prompt page creation routes
    const promptPageResults = await testPromptPageRoutes();
    results.total += promptPageResults.length;
    promptPageResults.forEach(result => {
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
        const errorMsg = result.error || `Status: ${result.statusCode}`;
        results.errors.push(`${result.type} (${result.campaign}): ${errorMsg}`);
      }
    });

    // Test prompt pages list routes
    const listResults = await testPromptPagesList();
    results.total += listResults.length;
    listResults.forEach(result => {
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
        const errorMsg = result.error || `Status: ${result.statusCode}`;
        results.errors.push(`${result.route}: ${errorMsg}`);
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
      console.log('\n🎉 ALL TESTS PASSED! All UI routes are working correctly.');
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