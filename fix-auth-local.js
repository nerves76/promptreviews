#!/usr/bin/env node

/**
 * Fix local authentication issues
 * This script ensures proper account setup for local testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function fixUserAccount(email) {
  console.log(`\n🔧 Fixing account for: ${email}`);
  
  try {
    // 1. Get the user using auth admin API
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return false;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found');
      return false;
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log(`❌ User ${email} not found in auth.users`);
      return false;
    }
    console.log(`✅ Found user: ${user.id}`);
    
    // 2. Check if account exists
    const { data: existingAccount, error: accountCheckError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (accountCheckError && accountCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking account:', accountCheckError);
      return false;
    }
    
    if (existingAccount) {
      console.log('✅ Account already exists');
      
      // Update account to ensure it has all required fields
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          email: email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('❌ Error updating account:', updateError);
      } else {
        console.log('✅ Account updated');
      }
    } else {
      console.log('📝 Creating new account...');
      
      // Create account
      const { error: createError } = await supabase
        .from('accounts')
        .insert({
          id: user.id,
          email: email,
          plan: 'grower',
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_free_account: false,
          custom_prompt_page_count: 0,
          contact_count: 0,
          first_name: 'Test',
          last_name: 'User',
          has_seen_welcome: false,
          review_notifications_enabled: true,
          is_admin: email === 'chris@diviner.agency' // Make you admin
        });
      
      if (createError) {
        console.error('❌ Error creating account:', createError);
        console.error('Details:', createError.details, createError.hint);
        return false;
      }
      
      console.log('✅ Account created');
    }
    
    // 3. Check account_users relationship
    const { data: accountUser, error: auCheckError } = await supabase
      .from('account_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_id', user.id)
      .single();
    
    if (auCheckError && auCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking account_users:', auCheckError);
    }
    
    if (!accountUser) {
      console.log('📝 Creating account_users relationship...');
      
      const { error: auCreateError } = await supabase
        .from('account_users')
        .insert({
          user_id: user.id,
          account_id: user.id,
          role: 'owner'
        });
      
      if (auCreateError) {
        console.error('❌ Error creating account_users:', auCreateError);
        console.error('Details:', auCreateError.details, auCreateError.hint);
        return false;
      }
      
      console.log('✅ Account relationship created');
    } else {
      console.log('✅ Account relationship already exists');
    }
    
    // 4. Verify everything is set up
    const { data: finalCheck, error: finalError } = await supabase
      .from('accounts')
      .select(`
        *,
        account_users!inner(*)
      `)
      .eq('id', user.id)
      .single();
    
    if (finalError) {
      console.error('❌ Final verification failed:', finalError);
      return false;
    }
    
    console.log('✅ Account setup verified successfully');
    console.log('📊 Account details:', {
      id: finalCheck.id,
      email: finalCheck.email,
      plan: finalCheck.plan,
      is_admin: finalCheck.is_admin,
      has_account_users: finalCheck.account_users.length > 0
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🔍 Local Auth Fix Tool');
  console.log('=' .repeat(50));
  
  const email = process.argv[2] || 'chris@diviner.agency';
  
  console.log(`📧 Fixing account for: ${email}`);
  
  const success = await fixUserAccount(email);
  
  if (success) {
    console.log('\n✅ Account fixed successfully!');
    console.log('You should now be able to log in.');
  } else {
    console.log('\n❌ Failed to fix account');
    console.log('Check the error messages above for details.');
  }
}

main().catch(console.error);