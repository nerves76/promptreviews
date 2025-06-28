/**
 * Test script for the force sign-in endpoint
 * Run with: node test-force-signin.js
 */

const testForceSignIn = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/force-signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'http://localhost:3001/auth/sign-in'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testForceSignIn(); 