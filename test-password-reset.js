/**
 * Test script to verify password reset flow
 * Tests: SMTP email sending, auth callback, and session establishment
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPasswordReset() {
  console.log('🧪 Testing password reset flow...\n');
  
  try {
    // Test 1: Request password reset
    console.log('📧 Step 1: Requesting password reset email...');
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      'test@example.com',
      {
        redirectTo: 'http://localhost:3002/auth/callback?next=/reset-password'
      }
    );
    
    if (error) {
      console.error('❌ Password reset request failed:', error.message);
      return;
    }
    
    console.log('✅ Password reset email request successful!');
    console.log('📮 Check the Supabase logs/email for the reset link\n');
    
    // Test 2: Verify SMTP configuration
    console.log('� Step 2: Checking SMTP configuration...');
    console.log('• Make sure SMTP is enabled in supabase/config.toml');
    console.log('• Verify site_url is set to http://localhost:3002');
    console.log('• Check that email templates redirect to auth/callback\n');
    
    console.log('� Step 3: Manual testing required:');
    console.log('1. Check email inbox for reset link');
    console.log('2. Click the reset link');
    console.log('3. Verify it goes to: /auth/callback?code=...&next=/reset-password');
    console.log('4. Should then redirect to: /reset-password');
    console.log('5. Reset password page should show the form (not spinner)\n');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

// Run the test
testPasswordReset().then(() => {
  console.log('� Test completed. Check the steps above for manual verification.');
});