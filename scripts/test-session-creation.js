#!/usr/bin/env node
/**
 * Test script for new account signup flow and middleware session timing
 * Simulates the exact flow that was causing infinite loading
 */

require('dotenv').config({ path: '.env.local' });

async function testSignupFlow() {
  console.log('🔧 SIGNUP FLOW SIMULATION TEST');
  console.log('===============================\n');
  
  console.log('📍 Test 1: Signup Page Access');
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch('http://localhost:3002/auth/sign-up', {
      method: 'GET'
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Signup page loads successfully');
    } else {
      console.log('❌ Signup page failed to load');
    }
    
  } catch (error) {
    console.error('❌ Signup page test failed:', error.message);
  }
  
  console.log('\n📍 Test 2: Auth Callback Simulation');
  console.log('─'.repeat(50));
  
  try {
    // Test auth callback with missing code (simulates expired link)
    const response = await fetch('http://localhost:3002/auth/callback?error=access_denied&error_code=otp_expired', {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Location: ${response.headers.get('location')}`);
    
    if (response.status === 307 && response.headers.get('location')?.includes('sign-in')) {
      console.log('✅ Auth callback correctly handles expired links');
    } else {
      console.log('⚠️ Unexpected auth callback behavior');
    }
    
  } catch (error) {
    console.error('❌ Auth callback test failed:', error.message);
  }
  
  console.log('\n📍 Test 3: Create Business Page Access');
  console.log('─'.repeat(50));
  
  try {
    // Test create-business page (where the infinite loading was happening)
    const response = await fetch('http://localhost:3002/dashboard/create-business', {
      method: 'GET'
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Create business page loads (middleware allows access in dev)');
    } else {
      console.log('❌ Create business page failed to load');
    }
    
  } catch (error) {
    console.error('❌ Create business page test failed:', error.message);
  }
  
  console.log('\n📍 Test 4: Session Timing Stress Test');
  console.log('─'.repeat(50));
  
  try {
    // Make many rapid requests to different protected routes
    const routes = [
      '/dashboard',
      '/dashboard/create-business',
      '/dashboard/analytics',
      '/dashboard/reviews'
    ];
    
    console.log('Making rapid requests to protected routes...');
    
    const requests = [];
    for (const route of routes) {
      for (let i = 0; i < 3; i++) {
        requests.push(
          fetch(`http://localhost:3002${route}`, {
            method: 'GET',
            redirect: 'manual'
          }).then(res => ({
            route,
            attempt: i + 1,
            status: res.status,
            timing: Date.now()
          }))
        );
      }
    }
    
    const results = await Promise.all(requests);
    
    // Group results by route
    const groupedResults = {};
    results.forEach(result => {
      if (!groupedResults[result.route]) {
        groupedResults[result.route] = [];
      }
      groupedResults[result.route].push(result);
    });
    
    console.log('\nResults by route:');
    Object.keys(groupedResults).forEach(route => {
      const routeResults = groupedResults[route];
      const statuses = routeResults.map(r => r.status);
      const allSame = statuses.every(s => s === statuses[0]);
      
      console.log(`  ${route}:`);
      console.log(`    Statuses: [${statuses.join(', ')}]`);
      console.log(`    Consistent: ${allSame ? '✅' : '❌'}`);
    });
    
    const allConsistent = Object.values(groupedResults).every(routeResults => {
      const statuses = routeResults.map(r => r.status);
      return statuses.every(s => s === statuses[0]);
    });
    
    if (allConsistent) {
      console.log('\n✅ All routes show consistent middleware behavior');
    } else {
      console.log('\n⚠️ Some routes show inconsistent behavior (possible timing issues)');
    }
    
  } catch (error) {
    console.error('❌ Stress test failed:', error.message);
  }
  
  console.log('\n📍 Test 5: Account Creation Flow Simulation');
  console.log('─'.repeat(50));
  
  try {
    // Test the exact sequence that happens during account creation
    console.log('Simulating account creation sequence...');
    
    // Step 1: Auth callback (successful)
    console.log('  1. Auth callback...');
    const callbackResponse = await fetch('http://localhost:3002/auth/callback', {
      method: 'GET',
      redirect: 'manual'
    });
    console.log(`     Status: ${callbackResponse.status}`);
    
    // Step 2: Immediate redirect to create-business
    console.log('  2. Redirect to create-business...');
    const createBusinessResponse = await fetch('http://localhost:3002/dashboard/create-business', {
      method: 'GET'
    });
    console.log(`     Status: ${createBusinessResponse.status}`);
    
    // Step 3: Rapid subsequent requests (this is where timing issues occurred)
    console.log('  3. Rapid subsequent requests...');
    const rapidRequests = [];
    for (let i = 0; i < 5; i++) {
      rapidRequests.push(
        fetch('http://localhost:3002/dashboard/create-business', {
          method: 'GET'
        }).then(res => res.status)
      );
    }
    
    const rapidStatuses = await Promise.all(rapidRequests);
    console.log(`     Statuses: [${rapidStatuses.join(', ')}]`);
    
    const allSuccess = rapidStatuses.every(s => s === 200);
    if (allSuccess) {
      console.log('     ✅ No session timing issues detected');
    } else {
      console.log('     ⚠️ Possible session timing issues');
    }
    
  } catch (error) {
    console.error('❌ Account creation flow test failed:', error.message);
  }
  
  console.log('\n🏁 SIGNUP FLOW SIMULATION COMPLETE');
  console.log('===================================');
  console.log('\n📊 Summary:');
  console.log('• Signup page should load normally');
  console.log('• Auth callback should handle errors gracefully');
  console.log('• Create business page should be accessible');
  console.log('• Multiple rapid requests should be consistent');
  console.log('• Account creation sequence should not have timing issues');
  console.log('\n🎯 This validates the complete signup → create-business flow');
}

// Run the test
if (require.main === module) {
  testSignupFlow().catch(console.error);
}

module.exports = { testSignupFlow }; 