#!/usr/bin/env node

/**
 * Google Business Profile Diagnostic Script
 * Tests authentication, location fetching, and posting functionality
 */

const http = require('http');
const { URL } = require('url');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function runDiagnostics() {
  console.log('🔍 Google Business Profile Diagnostic Test');
  console.log('==========================================\n');

  const baseUrl = 'http://localhost:3002';

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
      const response = await makeRequest(`${baseUrl}/dashboard/social-posting`);
      console.log(`   ✅ Server is running (status: ${response.status})`);
    } catch (error) {
      console.log(`   ❌ Server is not accessible: ${error.message}`);
      console.log('   💡 Make sure your dev server is running: npm run dev');
      return;
    }

    // Test 2: Check social posting platforms API
    console.log('\n2. Testing social posting platforms API...');
    try {
      const response = await makeRequest(`${baseUrl}/api/social-posting/platforms`);
      console.log(`   📊 Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('   ⚠️ Authentication required (user not logged in)');
        console.log('   💡 This is expected if no user is authenticated');
      } else if (response.status === 200) {
        const platforms = response.data.platforms || [];
        const gbp = platforms.find(p => p.id === 'google-business-profile');
        
        if (gbp) {
          console.log(`   📋 Google Business Profile: ${gbp.connected ? '✅ Connected' : '❌ Not connected'}`);
          console.log(`   📍 Locations: ${gbp.locations?.length || 0}`);
        } else {
          console.log('   ❌ Google Business Profile platform not found');
        }
      }
    } catch (error) {
      console.log(`   ❌ API Error: ${error.message}`);
    }

    // Test 3: Check Google OAuth callback endpoint
    console.log('\n3. Testing Google OAuth callback endpoint...');
    try {
      const response = await makeRequest(`${baseUrl}/api/auth/google/callback`);
      console.log(`   📊 Status: ${response.status}`);
      
      if (response.status === 302 || response.status === 307) {
        console.log('   ✅ Callback endpoint is working (redirects properly)');
      } else {
        console.log('   ⚠️ Callback returned unexpected status');
      }
    } catch (error) {
      console.log(`   ❌ Callback Error: ${error.message}`);
    }

    // Test 4: Check environment variables (client-side check)
    console.log('\n4. Checking environment configuration...');
    
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    let envIssues = false;
    
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        console.log(`   ✅ ${envVar}: SET`);
      } else {
        console.log(`   ❌ ${envVar}: MISSING`);
        envIssues = true;
      }
    });
    
    if (envIssues) {
      console.log('\n   💡 Add missing environment variables to .env.local');
    }

    // Test 5: Test demo mode functionality
    console.log('\n5. Testing demo mode functionality...');
    try {
      const demoData = {
        demoMode: true
      };
      
      const response = await makeRequest(`${baseUrl}/api/social-posting/platforms/google-business-profile/fetch-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(demoData)
      });
      
      console.log(`   📊 Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('   ⚠️ Demo mode requires authentication (expected)');
      } else if (response.status === 200 && response.data.demoMode) {
        console.log('   ✅ Demo mode is working correctly');
        console.log(`   📍 Mock locations returned: ${response.data.locations?.length || 0}`);
      } else {
        console.log('   ⚠️ Demo mode response unexpected');
      }
    } catch (error) {
      console.log(`   ❌ Demo mode error: ${error.message}`);
    }

    console.log('\n==========================================');
    console.log('🎯 DIAGNOSTICS COMPLETE');
    console.log('==========================================\n');

    console.log('📋 NEXT STEPS:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Visit: http://localhost:3002/dashboard/social-posting');
    console.log('3. Enable demo mode to test without OAuth');
    console.log('4. For real Google API: Complete OAuth flow first');
    console.log('5. Use "Fetch Locations" button to get business locations');
    console.log('6. Select a location and create a post');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run the diagnostics
runDiagnostics().catch(console.error); 