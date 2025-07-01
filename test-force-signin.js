/**
 * Test script for the force sign-in endpoint
 * Run with: node test-force-signin.js
 */

const { createClient } = require('@supabase/supabase-js');

// Test script to verify force-signin flow
async function testForceSignin() {
  console.log('🧪 Testing Force Sign-in Flow...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  );

  try {
    // 1. Check initial session state
    console.log('1️⃣ Checking initial session state...');
    const { data: { session: initialSession } } = await supabase.auth.getSession();
    console.log('Initial session:', initialSession ? 'Exists' : 'None');

    // 2. Call force-signin API
    console.log('\n2️⃣ Calling force-signin API...');
    const response = await fetch('http://localhost:3001/api/force-signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nerves76@gmail.com',
        password: 'password123',
      }),
    });

    const data = await response.json();
    console.log('Force-signin response status:', response.status);
    console.log('Force-signin success:', data.success);
    
    if (data.success) {
      console.log('✅ Force-signin successful');
      console.log('Session data returned:', !!data.data?.session);
      console.log('User data returned:', !!data.data?.user);
    } else {
      console.log('❌ Force-signin failed:', data.error);
      return;
    }

    // 3. Set session in Supabase client
    console.log('\n3️⃣ Setting session in Supabase client...');
    if (data.data?.session) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.data.session.access_token,
        refresh_token: data.data.session.refresh_token,
      });

      if (setSessionError) {
        console.log('❌ Error setting session:', setSessionError.message);
      } else {
        console.log('✅ Session set successfully');
      }
    }

    // 4. Verify session is now available
    console.log('\n4️⃣ Verifying session is available...');
    const { data: { session: finalSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else if (finalSession) {
      console.log('✅ Session verified successfully');
      console.log('User email:', finalSession.user.email);
      console.log('User ID:', finalSession.user.id);
    } else {
      console.log('❌ No session found after setting');
    }

    // 5. Test getting user data
    console.log('\n5️⃣ Testing user data access...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ User error:', userError.message);
    } else if (user) {
      console.log('✅ User data accessible');
      console.log('User email:', user.email);
      console.log('User ID:', user.id);
    } else {
      console.log('❌ No user data found');
    }

    console.log('\n🎉 Force-signin test complete!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testForceSignin(); 