/**
 * Clear Session Script
 * This script helps clear the user's session and get them logged out
 */

const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function clearSession() {
  console.log('🔐 Clearing user session...\n');

  try {
    // 1. Check current session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ Found active session for user:', session.user.email);
    } else {
      console.log('ℹ️  No active session found');
    }

    // 2. Sign out
    console.log('\n2. Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.log('❌ Sign out error:', signOutError.message);
    } else {
      console.log('✅ Successfully signed out');
    }

    // 3. Verify session is cleared
    console.log('\n3. Verifying session is cleared...');
    const { data: { session: newSession } } = await supabase.auth.getSession();
    
    if (newSession) {
      console.log('❌ Session still exists after sign out');
    } else {
      console.log('✅ Session successfully cleared');
    }

    console.log('\n🎉 Session clearing complete!');
    console.log('You can now log in again at http://localhost:3001/auth/sign-in');

  } catch (error) {
    console.error('❌ Error clearing session:', error.message);
  }
}

// Run the script
clearSession(); 