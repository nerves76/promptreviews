/**
 * Test script to verify account button is disabled for new users
 * This script tests the account button disabled state for new users
 */

const { createClient } = require('@supabase/supabase-js');

async function testAccountButtonDisabled() {
  console.log('🧪 Testing account button disabled state for new users...');
  
  try {
    // Test the dashboard page to see if account button is properly disabled
    console.log('📡 Testing dashboard page...');
    const response = await fetch('http://localhost:3002/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Dashboard page loads successfully');
      
      // Check if the account button has the disabled styling
      const html = await response.text();
      
      if (html.includes('opacity-50 cursor-not-allowed')) {
        console.log('✅ Account button has disabled styling');
      } else {
        console.log('❌ Account button missing disabled styling');
      }
      
      if (html.includes('Create your business profile first')) {
        console.log('✅ Account button has proper tooltip');
      } else {
        console.log('❌ Account button missing tooltip');
      }
      
      if (html.includes('router.push("/dashboard/create-business")')) {
        console.log('✅ Account button redirects to create business when disabled');
      } else {
        console.log('❌ Account button missing redirect logic');
      }
      
    } else {
      console.log('❌ Dashboard page failed to load');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAccountButtonDisabled().then(() => {
  console.log('🏁 Account button disabled test completed');
}); 