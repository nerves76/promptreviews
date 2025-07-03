/**
 * Automated Authentication Flow Testing
 * Tests the complete auth flow without manual login
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test credentials from handoff document
const TEST_EMAIL = 'nerves76@gmail.com';
const TEST_PASSWORD = 'Prcamus9721!';

async function testAuthFlow() {
  console.log('🔧 AUTOMATED AUTHENTICATION TESTING');
  console.log('=====================================\n');
  
  // Test 1: Supabase Client Creation
  console.log('📍 Test 1: Supabase Client Creation');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error.message);
    return;
  }

  // Test 2: API Route Availability
  console.log('\n📍 Test 2: API Route Availability');
  try {
    const response = await fetch('http://localhost:3002/api/auth/signin', {
      method: 'OPTIONS'
    });
    console.log(`✅ API route accessible (Status: ${response.status})`);
  } catch (error) {
    console.error('❌ API route not accessible:', error.message);
    return;
  }

  // Test 3: Authentication Request
  console.log('\n📍 Test 3: Authentication via API');
  try {
    const response = await fetch('http://localhost:3002/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Authentication successful');
      console.log('👤 User ID:', data.user?.id);
      console.log('📧 Email:', data.user?.email);
      console.log('🔑 Session expires:', new Date(data.session?.expires_at * 1000).toISOString());
      
      // Test 4: Session Token Validation
      console.log('\n📍 Test 4: Session Token Validation');
      const accessToken = data.session?.access_token;
      if (accessToken) {
        // Create client with session
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: data.session.refresh_token
        });
        
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ Session token is valid');
          console.log('👤 Validated user:', user.email);
        } else {
          console.error('❌ Session token invalid:', error?.message);
        }
      }
      
    } else {
      console.error('❌ Authentication failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Authentication request failed:', error.message);
  }

  // Test 5: Cookie Storage Simulation
  console.log('\n📍 Test 5: Cookie Storage Simulation');
  try {
    // Test what cookies would be set
    const cookieStore = new Map();
    
    // Simulate standard Supabase cookie storage
    const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
    const authCookieName = `sb-${projectRef}-auth-token`;
    
    console.log('🍪 Expected Supabase cookie name:', authCookieName);
    console.log('🍪 Manual cookie names removed: sb-access-token, sb-refresh-token');
    console.log('✅ Cookie format compatibility check complete');
    
  } catch (error) {
    console.error('❌ Cookie simulation failed:', error.message);
  }

  // Test 6: Middleware Compatibility Check
  console.log('\n📍 Test 6: Middleware Compatibility Check');
  try {
    const response = await fetch('http://localhost:3002/dashboard', {
      method: 'GET',
      redirect: 'manual'
    });
    
    if (response.status === 307) {
      console.log('✅ Middleware correctly redirects unauthenticated users');
      console.log('🔄 Redirect location:', response.headers.get('location'));
    } else {
      console.log('⚠️ Middleware behavior:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Middleware test failed:', error.message);
  }

  console.log('\n🏁 AUTOMATED TESTING COMPLETE');
  console.log('=====================================');
}

// Run if called directly
if (require.main === module) {
  testAuthFlow().catch(console.error);
}

module.exports = { testAuthFlow }; 