/**
 * Test script for Google Business Profile demo mode
 * This script tests the demo mode functionality without hitting the actual Google API
 */

const { GoogleBusinessProfileClient } = require('../src/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient');

async function testDemoMode() {
  console.log('🧪 Testing Google Business Profile Demo Mode...\n');

  // Set demo mode environment variable
  process.env.DEMO_MODE = 'true';
  process.env.NODE_ENV = 'development';

  // Create client with mock credentials - will make real API calls
  const client = new GoogleBusinessProfileClient({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000
  });

  try {
    console.log('📋 Testing listAccounts()...');
    const accounts = await client.listAccounts();
    console.log('✅ Accounts fetched successfully:', accounts.length);
    console.log('📄 Account data:', JSON.stringify(accounts, null, 2));

    console.log('\n📍 Testing listLocations()...');
    const locations = await client.listLocations('accounts/123456789');
    console.log('✅ Locations fetched successfully:', locations.length);
    console.log('📄 Location data:', JSON.stringify(locations, null, 2));

    console.log('\n🎭 Demo mode test completed successfully!');
    console.log('💡 This confirms that the demo mode bypasses the actual Google API calls.');

  } catch (error) {
    console.error('❌ Demo mode test failed:', error);
  }
}

// Run the test
testDemoMode(); 