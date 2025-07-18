/**
 * Test script to verify Google OAuth tables are working correctly
 * This script tests the table name fix for Google Business Profile OAuth
 */

const { createClient } = require('@supabase/supabase-js');

async function testGoogleOAuthTables() {
  console.log('🧪 Testing Google OAuth tables...');
  
  try {
    // Test the social posting platforms API to see if it can access the correct tables
    console.log('📡 Testing social posting platforms API...');
    const response = await fetch('http://localhost:3002/api/social-posting/platforms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Social posting platforms API working:', data);
      
      if (data.platforms && data.platforms.length > 0) {
        const googlePlatform = data.platforms.find(p => p.id === 'google-business-profile');
        if (googlePlatform) {
          console.log('✅ Google Business Profile platform found');
          console.log('📊 Platform status:', googlePlatform.status);
          console.log('📊 Connected:', googlePlatform.connected);
          console.log('📊 Locations count:', googlePlatform.locations.length);
        } else {
          console.log('❌ Google Business Profile platform not found');
        }
      } else {
        console.log('❌ No platforms returned');
      }
      
    } else if (response.status === 401) {
      console.log('⚠️  Authentication required - this is expected for unauthenticated requests');
    } else {
      console.log('❌ Social posting platforms API failed:', response.status);
      const errorText = await response.text();
      console.log('📊 Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGoogleOAuthTables().then(() => {
  console.log('🏁 Google OAuth tables test completed');
}); 