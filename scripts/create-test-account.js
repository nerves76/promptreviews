#!/usr/bin/env node

/**
 * Create Test Account Script
 * Creates a test account in the local Supabase database for development testing
 */

const { createClient } = require('@supabase/supabase-js');

// Use the local Supabase instance
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTestAccount() {
  try {
    console.log('🔧 Creating test account...');
    
    const testUserId = '12345678-1234-5678-9abc-123456789012';
    const testEmail = 'test@example.com';
    const accountId = '87654321-4321-8765-cba9-876543210987';
    
    // Create account record
    console.log('📝 Creating account record...');
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .upsert({
        id: accountId,
        user_id: testUserId,
        email: testEmail,
        first_name: 'Test',
        last_name: 'User',
        business_name: 'Test Business',
        plan: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (accountError) {
      console.error('❌ Account creation error:', accountError);
      throw accountError;
    }
    
    console.log('✅ Account created:', account);
    
    // Create business profile
    console.log('📝 Creating business profile...');
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .upsert({
        id: '11111111-2222-3333-4444-555555555555',
        account_id: accountId,
        name: 'Test Business',
        business_name: 'Test Business',
        industry: ['Technology'],
        website_url: 'https://example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        review_platforms: [
          {
            name: 'Google Business Profile',
            url: 'https://g.page/testbusiness'
          }
        ]
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (businessError) {
      console.error('❌ Business creation error:', businessError);
      throw businessError;
    }
    
    console.log('✅ Business created:', business);
    
    // Create universal prompt page
    console.log('📝 Creating universal prompt page...');
    const { data: promptPage, error: promptPageError } = await supabase
      .from('prompt_pages')
      .upsert({
        id: '99999999-8888-7777-6666-555555555555',
        account_id: accountId,
        slug: 'universal-test-12345',
        is_universal: true,
        status: 'published',
        campaign_type: 'universal',
        review_platforms: [
          {
            name: 'Google Business Profile',
            url: 'https://g.page/testbusiness'
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (promptPageError) {
      console.error('❌ Prompt page creation error:', promptPageError);
      throw promptPageError;
    }
    
    console.log('✅ Universal prompt page created:', promptPage);
    
    console.log('\n🎉 Test account setup complete!');
    console.log('📧 Email: test@example.com');
    console.log('🆔 User ID: test-user-12345');
    console.log('🏢 Account ID:', accountId);
    console.log('🔗 Universal page: http://localhost:3002/r/universal-test-12345');
    console.log('\n💡 To login locally, you can use this user ID in your auth mock or create a simple auth bypass.');
    
  } catch (error) {
    console.error('❌ Error creating test account:', error);
    process.exit(1);
  }
}

createTestAccount();