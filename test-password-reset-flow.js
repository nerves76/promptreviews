const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordResetFlow() {
  console.log('🧪 TESTING PASSWORD RESET FLOW');
  console.log('═══════════════════════════════════════\n');
  
  const testEmail = 'nerves76@gmail.com';
  const redirectTo = 'http://localhost:3002/auth/callback?next=/reset-password';
  
  console.log('1️⃣ Testing password reset email sending...');
  console.log('📧 Email:', testEmail);
  console.log('🔗 Redirect URL:', redirectTo);
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: redirectTo,
    });
    
    if (error) {
      console.error('❌ Password reset email failed:', error);
      console.error('   Error message:', error.message);
      console.error('   Error code:', error.status);
      return;
    }
    
    console.log('✅ Password reset email sent successfully!');
    console.log('📝 Check your email for the reset link');
    console.log('🔍 The link should go through auth callback then redirect to reset-password');
    
    console.log('\n2️⃣ Expected flow:');
    console.log('   ↳ User clicks email link');
    console.log('   ↳ Link goes to: /auth/callback?code=XXX&next=/reset-password');
    console.log('   ↳ Auth callback exchanges code for session');
    console.log('   ↳ Redirects to: /reset-password');
    console.log('   ↳ Reset password page detects session and allows password update');
    
    console.log('\n3️⃣ Debugging tips:');
    console.log('   • Check browser console for detailed logs');
    console.log('   • Look for "🔗 Auth callback triggered" messages');
    console.log('   • Verify session is established before password update');
    console.log('   • Check Supabase Auth logs in local dashboard');
    
    console.log('\n✅ Password reset flow test completed successfully!');
    console.log('📧 Check your email and follow the link to test the complete flow');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPasswordResetFlow(); 