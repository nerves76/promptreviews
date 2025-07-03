require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Test credentials
const TEST_EMAIL = 'nerves76@gmail.com';
const TEST_PASSWORD = 'Prcamus9721!';

async function testAuthenticationFlow() {
  console.log('🧪 COMPREHENSIVE AUTHENTICATION TEST');
  console.log('═══════════════════════════════════════');
  
  try {
    // Test 1: Direct Supabase Authentication
    console.log('\n📝 Test 1: Direct Supabase Client Authentication');
    console.log('─'.repeat(50));
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Clear any existing session
    await supabase.auth.signOut();
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Direct authentication failed:', authError.message);
      return false;
    }
    
    if (authData.user && authData.session) {
      console.log('✅ Direct authentication successful');
      console.log(`   User: ${authData.user.email}`);
      console.log(`   Session expires: ${new Date(authData.session.expires_at * 1000).toISOString()}`);
    } else {
      console.error('❌ Direct authentication failed: No user or session data');
      return false;
    }
    
    // Test 2: API Route Authentication
    console.log('\n📝 Test 2: API Route Authentication (/api/auth/signin)');
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch('http://localhost:3002/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API authentication failed:', errorData.error);
        return false;
      }
      
      const apiResult = await response.json();
      
      if (apiResult.user && apiResult.session) {
        console.log('✅ API authentication successful');
        console.log(`   User: ${apiResult.user.email}`);
        console.log(`   Session expires: ${new Date(apiResult.session.expires_at * 1000).toISOString()}`);
      } else {
        console.error('❌ API authentication failed: No user or session data');
        return false;
      }
      
    } catch (apiError) {
      console.error('❌ API authentication request failed:', apiError.message);
      return false;
    }
    
    // Test 3: Session Validation Endpoint
    console.log('\n📝 Test 3: Session Validation (/api/auth/session)');
    console.log('─'.repeat(50));
    
    try {
      const sessionResponse = await fetch('http://localhost:3002/api/auth/session');
      
      if (!sessionResponse.ok) {
        console.error('❌ Session validation request failed:', sessionResponse.status);
        return false;
      }
      
      const sessionData = await sessionResponse.json();
      
      if (sessionData.authenticated && sessionData.user) {
        console.log('✅ Session validation successful');
        console.log(`   Authenticated: ${sessionData.authenticated}`);
        console.log(`   User: ${sessionData.user.email}`);
        console.log(`   Error: ${sessionData.error || 'None'}`);
      } else {
        console.error('❌ Session validation failed:', sessionData);
        return false;
      }
      
    } catch (sessionError) {
      console.error('❌ Session validation request failed:', sessionError.message);
      return false;
    }
    
    // Test 4: Middleware Session Detection
    console.log('\n📝 Test 4: Middleware Session Detection (/dashboard)');
    console.log('─'.repeat(50));
    
    try {
      const dashboardResponse = await fetch('http://localhost:3002/dashboard', {
        redirect: 'manual' // Don't follow redirects
      });
      
      if (dashboardResponse.status === 200) {
        console.log('✅ Middleware allows dashboard access (session detected)');
      } else if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
        const location = dashboardResponse.headers.get('location');
        console.error('❌ Middleware redirects to:', location);
        console.error('   This indicates session is not detected by middleware');
        return false;
      } else {
        console.error('❌ Unexpected dashboard response:', dashboardResponse.status);
        return false;
      }
      
    } catch (middlewareError) {
      console.error('❌ Middleware test request failed:', middlewareError.message);
      return false;
    }
    
    // All tests passed
    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED!');
    console.log('═'.repeat(40));
    console.log('✅ Direct Supabase authentication works');
    console.log('✅ API route authentication works');
    console.log('✅ Session validation endpoint works');
    console.log('✅ Middleware detects sessions correctly');
    console.log('\n🚀 Authentication system is fully functional!');
    
    return true;
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR during authentication test:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 Environment Check');
  console.log('─'.repeat(20));
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Supabase Key: ${supabaseAnonKey ? '✅ Present' : '❌ Missing'}`);
  
  // Wait for server to be ready
  console.log('\n⏳ Waiting for development server...');
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:3002/api/check-env');
      if (response.ok) {
        console.log('✅ Development server is ready');
        break;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('❌ Development server not responding. Please run: npm run dev');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const success = await testAuthenticationFlow();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 