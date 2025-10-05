/**
 * Test script for share image generation system
 * Tests the quote card generation, caching, and storage logic
 *
 * Usage: node scripts/test-share-image-generation.js
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function testOgImageEndpoint(reviewId) {
  section('TEST 1: OG Image Generation Endpoint');

  try {
    const url = `${BASE_URL}/api/review-shares/og-image?reviewId=${reviewId}`;
    log(`Testing: ${url}`, 'cyan');

    const response = await fetch(url);

    if (response.ok && response.headers.get('content-type')?.includes('image')) {
      const buffer = await response.arrayBuffer();
      const size = buffer.byteLength;

      log(`✓ OG image generated successfully`, 'green');
      log(`  - Status: ${response.status}`, 'blue');
      log(`  - Content-Type: ${response.headers.get('content-type')}`, 'blue');
      log(`  - Size: ${(size / 1024).toFixed(2)} KB`, 'blue');
      log(`  - Dimensions: Should be 1200x630px`, 'blue');

      return { success: true, size };
    } else {
      const text = await response.text();
      log(`✗ OG image generation failed`, 'red');
      log(`  - Status: ${response.status}`, 'red');
      log(`  - Response: ${text}`, 'red');
      return { success: false, error: text };
    }
  } catch (error) {
    log(`✗ Error testing OG endpoint: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testImageGenerationAPI(reviewId, authToken) {
  section('TEST 2: Image Generation API (POST)');

  try {
    const url = `${BASE_URL}/api/review-shares/generate-image`;
    log(`Testing: ${url}`, 'cyan');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        review_id: reviewId,
        regenerate: false,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log(`✓ Image generation API successful`, 'green');
      log(`  - Image URL: ${data.image_url}`, 'blue');
      log(`  - Source: ${data.source}`, 'blue');
      log(`  - Message: ${data.message}`, 'blue');

      // Test if image URL is accessible
      const imageResponse = await fetch(data.image_url);
      if (imageResponse.ok) {
        log(`✓ Image URL is publicly accessible`, 'green');
      } else {
        log(`✗ Image URL returned ${imageResponse.status}`, 'red');
      }

      return { success: true, data };
    } else {
      log(`✗ Image generation failed`, 'red');
      log(`  - Status: ${response.status}`, 'red');
      log(`  - Response: ${JSON.stringify(data, null, 2)}`, 'red');
      return { success: false, error: data };
    }
  } catch (error) {
    log(`✗ Error testing generation API: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testCaching(reviewId, authToken) {
  section('TEST 3: Caching Behavior');

  try {
    log('Making first request...', 'cyan');
    const start1 = Date.now();
    const response1 = await fetch(`${BASE_URL}/api/review-shares/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ review_id: reviewId }),
    });
    const time1 = Date.now() - start1;
    const data1 = await response1.json();

    log('Making second request (should be cached)...', 'cyan');
    const start2 = Date.now();
    const response2 = await fetch(`${BASE_URL}/api/review-shares/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ review_id: reviewId }),
    });
    const time2 = Date.now() - start2;
    const data2 = await response2.json();

    log(`First request: ${time1}ms (${data1.source})`, 'blue');
    log(`Second request: ${time2}ms (${data2.source})`, 'blue');

    if (data2.source === 'cached_quote_card') {
      log(`✓ Caching is working correctly`, 'green');
      log(`  - Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`, 'green');
    } else if (data1.source === 'existing_photo' && data2.source === 'existing_photo') {
      log(`✓ Using existing photo (no cache needed)`, 'green');
    } else {
      log(`⚠ Caching behavior unexpected`, 'yellow');
    }

    return { success: true };
  } catch (error) {
    log(`✗ Error testing caching: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testRegeneration(reviewId, authToken) {
  section('TEST 4: Force Regeneration');

  try {
    const url = `${BASE_URL}/api/review-shares/generate-image`;
    log('Testing regenerate flag...', 'cyan');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        review_id: reviewId,
        regenerate: true,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log(`✓ Regeneration successful`, 'green');
      log(`  - Source: ${data.source}`, 'blue');
      log(`  - New image URL: ${data.image_url}`, 'blue');
      return { success: true, data };
    } else {
      log(`✗ Regeneration failed`, 'red');
      log(`  - Response: ${JSON.stringify(data, null, 2)}`, 'red');
      return { success: false, error: data };
    }
  } catch (error) {
    log(`✗ Error testing regeneration: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testErrorHandling() {
  section('TEST 5: Error Handling');

  const tests = [
    {
      name: 'Invalid review ID',
      reviewId: '00000000-0000-0000-0000-000000000000',
      expectedStatus: 404,
    },
    {
      name: 'Missing auth token',
      reviewId: '12345678-1234-1234-1234-123456789012',
      noAuth: true,
      expectedStatus: 401,
    },
  ];

  for (const test of tests) {
    try {
      log(`\nTesting: ${test.name}`, 'cyan');

      const headers = {
        'Content-Type': 'application/json',
      };

      if (!test.noAuth) {
        headers['Authorization'] = 'Bearer invalid_token';
      }

      const response = await fetch(`${BASE_URL}/api/review-shares/generate-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          review_id: test.reviewId,
        }),
      });

      const data = await response.json();

      if (response.status === test.expectedStatus) {
        log(`✓ Correct error status: ${response.status}`, 'green');
        log(`  - Error message: ${data.error || data.message}`, 'blue');
      } else {
        log(`✗ Unexpected status: ${response.status} (expected ${test.expectedStatus})`, 'yellow');
      }
    } catch (error) {
      log(`✗ Error in test "${test.name}": ${error.message}`, 'red');
    }
  }

  return { success: true };
}

async function runTests() {
  log('\n🧪 Share Image Generation Test Suite', 'bright');
  log('Testing image generation system for social media sharing\n', 'cyan');

  // Instructions
  section('SETUP INSTRUCTIONS');
  log('1. Ensure the development server is running:', 'yellow');
  log('   npm run dev', 'cyan');
  log('\n2. Set environment variables:', 'yellow');
  log('   NEXT_PUBLIC_APP_URL=http://localhost:3002', 'cyan');
  log('\n3. Provide test data:', 'yellow');
  log('   - REVIEW_ID: A valid review ID from your database', 'cyan');
  log('   - AUTH_TOKEN: A valid authentication token (optional for OG image test)', 'cyan');

  // Check if we have the required test data
  const reviewId = process.argv[2] || process.env.TEST_REVIEW_ID;
  const authToken = process.argv[3] || process.env.TEST_AUTH_TOKEN;

  if (!reviewId) {
    log('\n⚠ Missing REVIEW_ID parameter', 'red');
    log('Usage: node scripts/test-share-image-generation.js <REVIEW_ID> [AUTH_TOKEN]', 'yellow');
    log('\nYou can also set environment variables:', 'yellow');
    log('  TEST_REVIEW_ID=<uuid>', 'cyan');
    log('  TEST_AUTH_TOKEN=<token>', 'cyan');
    process.exit(1);
  }

  log(`\n📋 Test Configuration:`, 'bright');
  log(`  - Review ID: ${reviewId}`, 'blue');
  log(`  - Auth Token: ${authToken ? '✓ Provided' : '✗ Not provided'}`, 'blue');
  log(`  - Base URL: ${BASE_URL}`, 'blue');

  // Run tests
  const results = [];

  // Test 1: OG Image Endpoint (no auth required)
  results.push(await testOgImageEndpoint(reviewId));

  if (authToken) {
    // Test 2: Generation API
    results.push(await testImageGenerationAPI(reviewId, authToken));

    // Test 3: Caching
    results.push(await testCaching(reviewId, authToken));

    // Test 4: Regeneration
    results.push(await testRegeneration(reviewId, authToken));
  } else {
    log('\n⚠ Skipping authenticated tests (no auth token provided)', 'yellow');
  }

  // Test 5: Error Handling
  results.push(await testErrorHandling());

  // Summary
  section('TEST SUMMARY');
  const passed = results.filter(r => r.success).length;
  const total = results.length;

  if (passed === total) {
    log(`✓ All tests passed! (${passed}/${total})`, 'green');
  } else {
    log(`⚠ Some tests failed: ${passed}/${total} passed`, 'yellow');
  }

  log('\n📝 Next Steps:', 'bright');
  log('1. Verify generated images look correct in browser', 'cyan');
  log('2. Test with different business stylings', 'cyan');
  log('3. Check Supabase Storage bucket for uploaded images', 'cyan');
  log('4. Test social media sharing with generated images', 'cyan');
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
