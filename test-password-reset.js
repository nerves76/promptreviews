const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const APP_URL = 'http://localhost:3002';
const INBUCKET_URL = 'http://localhost:54324';
const TEST_EMAIL = 'nerves76@gmail.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function testPasswordResetFlow() {
  console.log('🧪 Starting Password Reset Test\n');

  try {
    // Step 1: Clear any existing emails from Inbucket
    console.log('1️⃣ Clearing existing emails from Inbucket...');
    try {
      await fetchWithTimeout(`${INBUCKET_URL}/api/v1/mailbox/${TEST_EMAIL.split('@')[0]}`, {
        method: 'DELETE'
      });
      console.log('✅ Cleared existing emails\n');
    } catch (error) {
      console.log('⚠️ Could not clear emails (this is okay):', error.message, '\n');
    }

    // Step 2: Request password reset
    console.log('2️⃣ Requesting password reset...');
    const { error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: `${APP_URL}/reset-password`,
    });

    if (error) {
      console.error('❌ Password reset request failed:', error.message);
      return;
    }
    console.log('✅ Password reset email requested\n');

    // Step 3: Wait and check for email in Inbucket
    console.log('3️⃣ Waiting for email to arrive...');
    let emailFound = false;
    let resetLink = null;
    
    for (let i = 0; i < 10; i++) {
      await sleep(2000); // Wait 2 seconds
      
      try {
        const response = await fetchWithTimeout(`${INBUCKET_URL}/api/v1/mailbox/${TEST_EMAIL.split('@')[0]}`);
        const emails = await response.json();
        
        if (emails && emails.length > 0) {
          console.log(`✅ Found ${emails.length} email(s) in Inbucket`);
          
          // Get the latest email
          const latestEmail = emails[0];
          const emailResponse = await fetchWithTimeout(`${INBUCKET_URL}/api/v1/mailbox/${TEST_EMAIL.split('@')[0]}/${latestEmail.id}`);
          const emailData = await emailResponse.json();
          
          console.log('📧 Email details:');
          console.log('   Subject:', emailData.subject);
          console.log('   From:', emailData.from.address);
          console.log('   To:', emailData.to[0].address);
          
          // Extract reset link from email body
          const emailBody = emailData.body.text || emailData.body.html || '';
          const linkMatch = emailBody.match(/(https?:\/\/[^\s]+)/);
          
          if (linkMatch) {
            resetLink = linkMatch[1];
            console.log('🔗 Reset link found:', resetLink);
            emailFound = true;
            break;
          } else {
            console.log('⚠️ No reset link found in email body');
            console.log('Email body preview:', emailBody.substring(0, 200) + '...');
          }
        } else {
          console.log(`⏳ Attempt ${i + 1}/10: No emails yet, waiting...`);
        }
      } catch (error) {
        console.log(`⚠️ Error checking emails (attempt ${i + 1}/10):`, error.message);
      }
    }

    if (!emailFound) {
      console.error('❌ No password reset email found in Inbucket after 20 seconds');
      return;
    }

    console.log('\n4️⃣ Testing reset link...');
    
    // Step 4: Analyze the reset link
    const url = new URL(resetLink);
    console.log('🔍 Reset link analysis:');
    console.log('   Base URL:', `${url.protocol}//${url.host}${url.pathname}`);
    console.log('   Search params:', [...url.searchParams.entries()]);
    console.log('   Hash:', url.hash);

    // Step 5: Test accessing the reset link
    console.log('\n5️⃣ Testing reset page access...');
    try {
      const response = await fetchWithTimeout(resetLink, {
        method: 'GET',
        redirect: 'manual' // Don't follow redirects automatically
      });
      
      console.log('📊 Reset link response:');
      console.log('   Status:', response.status, response.statusText);
      console.log('   Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        console.log('🔄 Redirect to:', location);
        
        // Follow the redirect
        if (location) {
          const redirectResponse = await fetchWithTimeout(location);
          console.log('📊 Redirect response:');
          console.log('   Status:', redirectResponse.status, redirectResponse.statusText);
          
          const html = await redirectResponse.text();
          if (html.includes('Reset your password')) {
            console.log('✅ Reset password page loaded successfully');
          } else if (html.includes('Invalid Reset Link')) {
            console.log('❌ Reset password page shows "Invalid Reset Link"');
          } else {
            console.log('⚠️ Reset password page content unclear');
            console.log('   Page title:', html.match(/<title>(.*?)<\/title>/)?.[1] || 'No title found');
          }
        }
      } else {
        const html = await response.text();
        if (html.includes('Reset your password')) {
          console.log('✅ Reset password page loaded successfully');
        } else if (html.includes('Invalid Reset Link')) {
          console.log('❌ Reset password page shows "Invalid Reset Link"');
        } else {
          console.log('⚠️ Reset password page content unclear');
          console.log('   Page title:', html.match(/<title>(.*?)<\/title>/)?.[1] || 'No title found');
        }
      }
      
    } catch (error) {
      console.error('❌ Error testing reset link:', error.message);
    }

    // Step 6: Test session establishment
    console.log('\n6️⃣ Testing session establishment...');
    try {
      const sessionResponse = await fetchWithTimeout(`${APP_URL}/api/test-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resetLink })
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        console.log('📊 Session test result:', sessionData);
      } else {
        console.log('⚠️ Session test endpoint not available');
      }
    } catch (error) {
      console.log('⚠️ Could not test session (endpoint may not exist)');
    }

    console.log('\n🎉 Password reset test completed!');
    console.log('\n📋 SUMMARY:');
    console.log(`   Reset email sent: ✅`);
    console.log(`   Email received: ${emailFound ? '✅' : '❌'}`);
    console.log(`   Reset link found: ${resetLink ? '✅' : '❌'}`);
    console.log(`   Reset link: ${resetLink || 'Not found'}`);

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPasswordResetFlow().catch(console.error);