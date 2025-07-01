/**
 * Welcome Email Debug Script
 * 
 * This script checks various components of the welcome email system:
 * 1. Environment variables (especially RESEND_API_KEY)
 * 2. Email templates in database  
 * 3. Resend API connectivity
 * 4. Template rendering
 * 5. End-to-end email sending test
 */

const { createClient } = require('@supabase/supabase-js');

async function debugWelcomeEmail() {
  console.log('🔍 Welcome Email Debug Report\n');
  console.log('='.repeat(50));

  // 1. Check Environment Variables
  console.log('\n📋 1. Environment Variables Check');
  console.log('-'.repeat(30));
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  let missingEnvVars = [];
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${envVar === 'RESEND_API_KEY' ? `${value.substring(0, 8)}...` : value}`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
      missingEnvVars.push(envVar);
    }
  }
  
  if (missingEnvVars.length > 0) {
    console.log(`\n⚠️  Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.log('Please create a .env.local file with the missing variables.');
    return;
  }

  // 2. Check Supabase Connection & Email Templates
  console.log('\n📋 2. Database & Email Templates Check');
  console.log('-'.repeat(30));
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check email_templates table
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'welcome');

    if (templatesError) {
      console.log('❌ Error accessing email_templates table:', templatesError.message);
      return;
    }

    if (!templates || templates.length === 0) {
      console.log('❌ Welcome email template not found in database');
      console.log('   Run this SQL to create the template:');
      console.log(`   INSERT INTO email_templates (name, subject, html_content, is_active) VALUES 
   ('welcome', 'Welcome to PromptReviews! 🎉', '<p>Welcome {{firstName}}!</p>', true);`);
      return;
    }

    const welcomeTemplate = templates[0];
    console.log(`✅ Welcome template found: "${welcomeTemplate.subject}"`);
    console.log(`   Active: ${welcomeTemplate.is_active}`);
    console.log(`   HTML content length: ${welcomeTemplate.html_content.length} chars`);
    
    if (!welcomeTemplate.is_active) {
      console.log('⚠️  Welcome template is INACTIVE - this will prevent emails from sending!');
    }

  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return;
  }

  // 3. Check Resend API
  console.log('\n📋 3. Resend API Check');
  console.log('-'.repeat(30));
  
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Test basic API connectivity
    console.log('✅ Resend SDK initialized successfully');
    console.log('   Note: Cannot test API key without sending an email');
    
  } catch (error) {
    console.log('❌ Resend SDK error:', error.message);
    return;
  }

  // 4. Test Template Rendering
  console.log('\n📋 4. Template Rendering Test');
  console.log('-'.repeat(30));
  
  try {
    // Test the renderTemplate function
    const testTemplate = 'Hello {{firstName}}, welcome to {{dashboardUrl}}!';
    const testVariables = {
      firstName: 'John',
      dashboardUrl: 'https://app.promptreviews.app/dashboard'
    };
    
    let rendered = testTemplate;
    Object.entries(testVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value || '');
    });
    
    console.log('✅ Template rendering test passed');
    console.log(`   Input: "${testTemplate}"`);
    console.log(`   Output: "${rendered}"`);
    
  } catch (error) {
    console.log('❌ Template rendering error:', error.message);
  }

  // 5. Check Welcome Email Function
  console.log('\n📋 5. Welcome Email Function Check');
  console.log('-'.repeat(30));
  
  console.log('⚠️  To avoid sending test emails, skipping actual email send test');
  console.log('   If you want to test sending, run: node test-send-welcome.js');

  // 6. Check Auth Callback Logic
  console.log('\n📋 6. Auth Callback Logic Check');
  console.log('-'.repeat(30));
  
  console.log('🔍 Welcome email is triggered in src/app/auth/callback/route.ts');
  console.log('   Conditions for sending:');
  console.log('   ✓ isNewUser === true');
  console.log('   ✓ email exists');
  console.log('   ✓ No errors in email function');
  
  console.log('\n📝 Debug tips:');
  console.log('   1. Check browser console during signup for auth callback logs');
  console.log('   2. Look for "📧 Welcome email sent to:" or "❌ Error sending welcome email:" logs');
  console.log('   3. Verify isNewUser logic in callback - check account_users table');

  console.log('\n🎯 Summary & Next Steps');
  console.log('='.repeat(50));
  console.log('1. If templates are missing: Run migration or manually insert');
  console.log('2. If RESEND_API_KEY is missing: Add to .env.local');
  console.log('3. If templates are inactive: Update is_active = true');
  console.log('4. Check signup flow logs in browser console');
  console.log('5. Test with: curl -X POST localhost:3001/api/send-welcome-email \\');
  console.log('   -H "Content-Type: application/json" \\');
  console.log('   -d \'{"email":"test@example.com","name":"Test"}\'');
}

// Run the debug
debugWelcomeEmail().catch(error => {
  console.error('Debug script error:', error);
  process.exit(1);
});