#!/usr/bin/env node

/**
 * Test Feedback System
 * 
 * This script tests the feedback submission system to ensure it's working
 * after the RLS policy fix that was blocking anonymous submissions.
 */

require('dotenv').config({ path: '.env.local' });

async function testFeedbackSystem() {
  console.log('🧪 Testing Feedback System...\n');

  try {
    // Test 1: Anonymous feedback submission
    console.log('1️⃣ Testing anonymous feedback submission...');
    const anonymousResponse = await fetch('http://localhost:3002/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'bug_report',
        message: 'Test anonymous feedback - RLS policy fix verification',
        email: 'test@example.com'
      }),
    });

    if (anonymousResponse.ok) {
      const result = await anonymousResponse.json();
      console.log('✅ Anonymous feedback submission successful:', result.feedback_id);
    } else {
      const error = await anonymousResponse.json();
      console.error('❌ Anonymous feedback failed:', error);
    }

    // Test 2: Check if feedback appears in admin view
    console.log('\n2️⃣ Checking feedback visibility...');
    console.log('   📍 Go to: http://localhost:3002/admin/feedback');
    console.log('   🔍 Look for the test feedback we just submitted');

    console.log('\n✅ Test completed!');
    console.log('📝 Next steps:');
    console.log('   1. Test the speech bubble on the live site');
    console.log('   2. Have Mary try submitting feedback again');
    console.log('   3. Check admin feedback page for her submissions');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Make sure dev server is running: npm run dev');
    console.log('   2. Check that .env.local is configured correctly');
    console.log('   3. Verify database connection');
  }
}

// Run the test
if (require.main === module) {
  testFeedbackSystem();
} 