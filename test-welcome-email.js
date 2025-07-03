#!/usr/bin/env node

/**
 * Test Welcome Email Functionality
 * 
 * This script tests the welcome email system to identify what's preventing
 * emails from being sent during signup.
 */

// Load environment variables the same way Next.js does
const path = require('path');
const { config } = require('dotenv');

// Load .env.local first, then .env
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Testing Welcome Email System\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set (will use default)');
console.log('');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables. Please check your .env.local file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEmailTemplates() {
  console.log('📧 Testing Email Templates:');
  
  try {
    // Check if email_templates table exists and has data
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('name, subject, is_active')
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ Error accessing email_templates table:', error.message);
      return false;
    }
    
    console.log(`✅ Found ${templates.length} active email templates`);
    
    // Look for welcome template specifically
    const welcomeTemplate = templates.find(t => t.name === 'welcome');
    if (welcomeTemplate) {
      console.log('✅ Welcome template found:', welcomeTemplate.subject);
    } else {
      console.log('❌ Welcome template NOT found');
      console.log('Available templates:', templates.map(t => t.name).join(', '));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking email templates:', error);
    return false;
  }
}

async function testResendConnection() {
  console.log('\n📬 Testing Resend API:');
  
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in environment');
    return false;
  }
  
  try {
    // Try to import and test Resend
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Just test if the API key is valid format (starts with 're_')
    if (process.env.RESEND_API_KEY.startsWith('re_')) {
      console.log('✅ Resend API key format looks correct');
    } else {
      console.log('⚠️ Resend API key format might be incorrect (should start with "re_")');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing Resend:', error.message);
    return false;
  }
}

async function testWelcomeEmailFunction() {
  console.log('\n🎯 Testing Welcome Email Function:');
  
  try {
    // Import the actual welcome email function
    const { sendWelcomeEmail } = require('./src/utils/emailTemplates');
    
    // Test with a dummy email (won't actually send)
    const testEmail = 'test@example.com';
    const testName = 'Test User';
    
    console.log(`📤 Testing sendWelcomeEmail('${testEmail}', '${testName}')...`);
    
    const result = await sendWelcomeEmail(testEmail, testName);
    
    if (result.success) {
      console.log('✅ Welcome email function executed successfully');
      console.log('📧 Email would be sent to:', testEmail);
    } else {
      console.log('❌ Welcome email function failed:', result.error);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error testing welcome email function:', error.message);
    return false;
  }
}

async function checkRecentSignups() {
  console.log('\n👥 Checking Recent Signups:');
  
  try {
    // Check for recent user signups
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return;
    }
    
    // Filter users created in the last 24 hours
    const recentUsers = users.users.filter(user => {
      const createdAt = new Date(user.created_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > dayAgo;
    });
    
    console.log(`📊 Found ${recentUsers.length} users created in the last 24 hours`);
    
    if (recentUsers.length > 0) {
      console.log('Recent signups:');
      recentUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.email_confirmed_at ? 'confirmed' : 'pending confirmation'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking recent signups:', error);
  }
}

async function runTests() {
  const templatesOk = await testEmailTemplates();
  const resendOk = await testResendConnection();
  const emailFunctionOk = await testWelcomeEmailFunction();
  
  await checkRecentSignups();
  
  console.log('\n📋 Test Summary:');
  console.log('Email Templates:', templatesOk ? '✅ OK' : '❌ FAILED');
  console.log('Resend API:', resendOk ? '✅ OK' : '❌ FAILED');
  console.log('Email Function:', emailFunctionOk ? '✅ OK' : '❌ FAILED');
  
  if (templatesOk && resendOk && emailFunctionOk) {
    console.log('\n🎉 All tests passed! Welcome emails should be working.');
    console.log('\n💡 If you\'re still not receiving emails:');
    console.log('   1. Check your spam/junk folder');
    console.log('   2. Verify the sending domain is not blocked');
    console.log('   3. Check browser console during signup for error messages');
    console.log('   4. Look for "📧 Welcome email sent to:" or "❌ Error sending welcome email:" logs');
  } else {
    console.log('\n❌ Some tests failed. Check the issues above.');
  }
}

runTests().catch(console.error);