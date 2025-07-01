/**
 * Test Welcome Email Script
 * 
 * This script directly tests the welcome email sending functionality
 * by calling the API endpoint with test data
 */

async function testWelcomeEmail() {
  console.log('🧪 Testing Welcome Email API\n');
  
  const testEmail = 'test@example.com';
  const testName = 'Test User';
  
  try {
    console.log(`📧 Sending test welcome email to: ${testEmail}`);
    
    const response = await fetch('http://localhost:3001/api/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        name: testName,
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Welcome email API call successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ Welcome email API call failed');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
    console.log('\n💡 Make sure your Next.js server is running on http://localhost:3001');
    console.log('   Run: npm run dev');
  }
}

// Run test
testWelcomeEmail();