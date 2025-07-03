/**
 * Frontend Authentication Test Script
 * 
 * This script simulates the frontend authentication process to debug
 * issues with the Supabase client and session handling.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as the frontend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create the same client configuration as the frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use standard Supabase storage key for compatibility
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function testAuthentication() {
  console.log('🧪 Testing Frontend Authentication...\n');
  
  try {
    // Test 1: Check current session
    console.log('1. Checking current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('   Session data:', sessionData);
    console.log('   Session error:', sessionError);
    console.log('');
    
    // Test 2: Attempt sign in
    console.log('2. Attempting sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nerves76@gmail.com',
      password: 'Prcamus9721!'
    });
    
    if (error) {
      console.error('   Sign in error:', error);
      return;
    }
    
    console.log('   Sign in successful!');
    console.log('   User data:', data.user);
    console.log('   Session:', data.session);
    console.log('');
    
    // Test 3: Check session after sign in
    console.log('3. Checking session after sign in...');
    const { data: newSessionData, error: newSessionError } = await supabase.auth.getSession();
    console.log('   New session data:', newSessionData);
    console.log('   New session error:', newSessionError);
    console.log('');
    
    // Test 4: Check if session is persisted
    console.log('4. Testing session persistence...');
    const { data: storageData } = await supabase.auth.getSession();
    console.log('   Storage session:', storageData);
    
    if (storageData.session) {
      console.log('   ✅ Session is properly stored!');
    } else {
      console.log('   ❌ Session is not stored properly');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAuthentication(); 