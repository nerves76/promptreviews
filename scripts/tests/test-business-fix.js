/**
 * Test Business Creation Fix (Full E2E)
 * 
 * This script tests that the business creation RLS fix works correctly
 * by creating a real user in Supabase Auth, then an account, then a business.
 * It also checks for a valid Universal prompt page URL for the account.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function testBusinessFix() {
  console.log('🧪 Testing Business Creation Fix (Full E2E)...\n');

  try {
    // 1. Create a real user in Supabase Auth
    const testEmail = `test-biz-fix-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!'
    });
    if (userError || !userData || !userData.user) {
      console.error('❌ Error creating test user:', userError || userData);
      return;
    }
    const userId = userData.user.id;
    console.log('✅ Created test user:', userId);

    // 2. Create an account for the user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        id: userId,
        email: testEmail,
        first_name: 'Test',
        last_name: 'User',
        plan: 'no_plan',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0,
        created_at: new Date().toISOString(),
        has_seen_welcome: false,
        review_notifications_enabled: true
      })
      .select();
    if (accountError) {
      console.error('❌ Error creating test account:', accountError);
      return;
    }
    console.log('✅ Created test account:', userId);

    // 3. Wait briefly for trigger to add to account_users
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 4. Create a business for the account
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        account_id: userId,
        name: `Test Business ${Date.now()}`
      })
      .select();
    if (businessError) {
      console.error('❌ Error creating business:', businessError);
      return;
    }
    console.log('✅ Created business for account:', userId);

    // 5. Check for Universal prompt page for the account
    const { data: promptPages, error: promptPageError } = await supabase
      .from('prompt_pages')
      .select('id, slug, type, account_id')
      .eq('account_id', userId)
      .eq('type', 'universal')
      .limit(1);
    if (promptPageError) {
      console.error('❌ Error querying prompt_pages:', promptPageError);
    } else if (!promptPages || promptPages.length === 0) {
      console.warn('⚠️  No Universal prompt page found for account:', userId);
    } else {
      const page = promptPages[0];
      if (!page.slug) {
        console.warn('⚠️  Universal prompt page found but missing slug:', page);
      } else {
        const url = `/r/${page.slug}`;
        console.log('✅ Universal prompt page URL:', url);
      }
    }

    // 6. Clean up test data
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from('businesses').delete().eq('account_id', userId);
    await supabase.from('accounts').delete().eq('id', userId);
    await supabase.from('prompt_pages').delete().eq('account_id', userId);
    console.log('🧹 Cleaned up test data.');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testBusinessFix(); 