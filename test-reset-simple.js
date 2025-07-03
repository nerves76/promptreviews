// Simple password reset test
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testReset() {
  console.log('🧪 Requesting password reset...');
  
  const { error } = await supabase.auth.resetPasswordForEmail('nerves76@gmail.com', {
    redirectTo: 'http://localhost:3002/reset-password',
  });

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Reset email sent!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Check Inbucket: http://localhost:54324');
    console.log('2. Click the reset link in the email');
    console.log('3. Should go through /auth/callback then to /reset-password');
    console.log('4. Check browser console for logs');
    console.log('\n🔍 DEBUGGING:');
    console.log('- Test session: http://localhost:3002/api/test-session');
    console.log('- Check callback logs in terminal');
  }
}

testReset();